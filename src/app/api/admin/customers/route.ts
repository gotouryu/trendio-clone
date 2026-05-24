import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceUserRateLimit } from "@/lib/rateLimit";
import { writeAdminAuditLog } from "@/lib/adminAudit";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Cache-Control: no-store(=パスワードレスポンスのキャッシュ防止) */
function noStoreJson(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("Pragma", "no-cache");
  return res;
}

// GET /api/admin/customers — list all customers with usage stats
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "admin_customer_list",
    windowSec: 60,
    maxInWindow: 30,
  });
  if (rateLimit) return rateLimit;

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams, 50, 200);
  if (!pagination.ok) return pagination.response;
  const { limit, offset } = pagination;
  const parsedSearch = parseSearch(searchParams.get("q"));
  if (!parsedSearch.ok) return parsedSearch.response;

  const admin = createSupabaseAdmin();
  const { data, count, error } = await applyCustomerSearch(
    admin
      .from("customer_usage")
      .select("*", { count: "exact" })
      .order("registered_at", { ascending: false }),
    parsedSearch.q,
  ).range(offset, offset + limit - 1);
  if (error)
    return NextResponse.json(
      { error: "admin_customer_list_failed" },
      { status: 500 },
    );
  const [{ count: active30dCount }, { count: suspendedCount }] =
    await Promise.all([
      applyCustomerSearch(
        admin
          .from("customer_usage")
          .select("id", { count: "exact", head: true })
          .gt("logins_30d", 0),
        parsedSearch.q,
      ),
      applyCustomerSearch(
        admin
          .from("customer_usage")
          .select("id", { count: "exact", head: true })
          .eq("status", "suspended"),
        parsedSearch.q,
      ),
    ]);

  return NextResponse.json({
    customers: data,
    totalCount: count ?? data?.length ?? 0,
    active30dCount: active30dCount ?? 0,
    suspendedCount: suspendedCount ?? 0,
    limit,
    offset,
  });
}

// POST /api/admin/customers — create new customer + initial password
export async function POST(req: NextRequest) {
  // Phase 3 Wave-B 修正:CSRF Origin/Referer 検証
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "admin_customer_create",
    windowSec: 60,
    maxInWindow: 10,
  });
  if (rateLimit) return rateLimit;

  let body: { email: string; companyName: string };
  try {
    body = (await req.json()) as { email: string; companyName: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (
    typeof body.email !== "string" ||
    typeof body.companyName !== "string" ||
    !body.email.trim() ||
    !body.companyName.trim()
  ) {
    return NextResponse.json(
      { error: "email and companyName required" },
      { status: 400 },
    );
  }

  // Phase 3 Wave-B:Email/CompanyName の長さ・形式 軽量バリデーション
  const email = body.email.trim();
  const companyName = body.companyName.trim();
  if (email.length > 200 || companyName.length > 80) {
    return NextResponse.json({ error: "input too long" }, { status: 400 });
  }
  // 簡易メアド形式チェック(=完全形式は Supabase Auth 側で再検証)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "invalid email format" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();
  // Generate a random initial password (12 chars)
  const password = generatePassword(12);

  const auditOk = await writeAdminAuditLog({
    actorUserId: auth.userId,
    action: "admin_customer_create",
    payload: { email, companyName },
    req,
  });
  if (!auditOk) {
    return NextResponse.json({ error: "audit_log_failed" }, { status: 500 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation; admin issues the account
    user_metadata: { company_name: companyName, role: "customer" },
  });

  if (error) return NextResponse.json({ error: "customer_create_failed" }, { status: 400 });

  // Phase 3 Wave-B:Cache-Control: no-store でパスワードを CDN/proxy にキャッシュさせない
  return noStoreJson({
    id: data.user.id,
    email: data.user.email,
    initialPassword: password, // shown ONCE to admin
  });
}

// Supabase query builder types become too deep after chained view filters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCustomerSearch(query: any, q: string) {
  if (!q) return query;
  const safe = q.replace(/[%_,]/g, " ").trim();
  if (!safe) return query;
  if (UUID_RE.test(safe)) {
    return query.or(`id.eq.${safe},company_name.ilike.%${safe}%`);
  }
  return query.ilike("company_name", `%${safe}%`);
}

function parseSearch(
  raw: string | null,
):
  | { ok: true; q: string }
  | { ok: false; response: NextResponse } {
  const q = (raw ?? "").trim();
  if (q.length > 80) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "search query too long" },
        { status: 400 },
      ),
    };
  }
  return { ok: true, q };
}

function generatePassword(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit: number,
  maxLimit: number,
):
  | { ok: true; limit: number; offset: number }
  | { ok: false; response: NextResponse } {
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam === null ? defaultLimit : Number(limitParam);
  const offset = offsetParam === null ? 0 : Number(offsetParam);

  if (
    !Number.isInteger(limit) ||
    !Number.isInteger(offset) ||
    limit < 1 ||
    limit > maxLimit ||
    offset < 0 ||
    offset > 100000
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `limit must be 1-${maxLimit} and offset must be 0-100000` },
        { status: 400 },
      ),
    };
  }

  return { ok: true, limit, offset };
}
