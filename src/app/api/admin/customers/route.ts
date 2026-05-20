import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { assertSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

/** Cache-Control: no-store(=パスワードレスポンスのキャッシュ防止) */
function noStoreJson(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("Pragma", "no-cache");
  return res;
}

// GET /api/admin/customers — list all customers with usage stats
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("customer_usage")
    .select("*")
    .order("registered_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data });
}

// POST /api/admin/customers — create new customer + initial password
export async function POST(req: NextRequest) {
  // Phase 3 Wave-B 修正:CSRF Origin/Referer 検証
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { email: string; companyName: string };
  if (!body.email || !body.companyName) {
    return NextResponse.json(
      { error: "email and companyName required" },
      { status: 400 },
    );
  }

  // Phase 3 Wave-B:Email/CompanyName の長さ・形式 軽量バリデーション
  if (body.email.length > 200 || body.companyName.length > 200) {
    return NextResponse.json({ error: "input too long" }, { status: 400 });
  }
  // 簡易メアド形式チェック(=完全形式は Supabase Auth 側で再検証)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json(
      { error: "invalid email format" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();
  // Generate a random initial password (12 chars)
  const password = generatePassword(12);

  const { data, error } = await admin.auth.admin.createUser({
    email: body.email,
    password,
    email_confirm: true, // skip email confirmation; admin issues the account
    user_metadata: { company_name: body.companyName, role: "customer" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Phase 3 Wave-B:Cache-Control: no-store でパスワードを CDN/proxy にキャッシュさせない
  return noStoreJson({
    id: data.user.id,
    email: data.user.email,
    initialPassword: password, // shown ONCE to admin
  });
}

function generatePassword(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
