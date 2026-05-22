/**
 * GET /api/customers — 顧客カルテ一覧
 *
 * Query: ?search=<handle>&status=<status>&tag=<tag>&limit=50&offset=0
 * Response: { customers: Customer[], totalCount: number }
 *
 * 共P-01「顧客行動履歴・CRM」要件:顧客名寄せ済み一覧 + フィルタ + 検索
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";
import { mockCustomers } from "@/lib/mockData";
import type { Customer } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const rawSearch = searchParams.get("search")?.toLowerCase() ?? "";
  // PostgREST の or() に直挿入するため構文文字を除去:
  //  ,()*:\\.  — PostgREST のフィールド/オペレータ区切り文字
  //  %  — SQL LIKE のワイルドカード(=0個以上の任意文字)、未エスケープなら全件マッチDoS
  // この sanitize がないと "foo,status.eq.admin" や "%" 一文字で別フィルタ差し込み/全件マッチが可能。
  // 注:_ は本来「アンダースコアを含むハンドル」(=instagram は _ 許可)を検索したい
  //     正当な入力なので削除せず、LIKE では `\_` でエスケープし「文字としての _」のみマッチさせる。
  const cleaned = rawSearch.replace(/[,()*:%\\.]/g, "").trim().slice(0, 64);
  const search = cleaned; // 表示・フィルタロジック用(=元の値、_ を含む)
  const searchLike = cleaned.replace(/_/g, "\\_"); // PostgREST ilike 用にエスケープ
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const pagination = parsePagination(searchParams, 50, 200);
  if (!pagination.ok) return pagination.response;
  const { limit, offset } = pagination;

  const sb = await createSupabaseServer();
  if (!sb) {
    // Supabase未設定:モック顧客を返す
    let list = mockCustomers;
    if (search)
      list = list.filter(
        (c) =>
          c.instagramHandle.toLowerCase().includes(search) ||
          c.displayName.toLowerCase().includes(search),
      );
    if (status) list = list.filter((c) => c.status === status);
    if (tag) list = list.filter((c) => c.tags.includes(tag as never));
    return NextResponse.json({
      customers: list.slice(offset, offset + limit),
      totalCount: list.length,
      mock: true,
    });
  }

  let query = sb
    .from("customer_overview_v")
    .select("*", { count: "exact" })
    .eq("user_id", auth.userId)
    .order("last_contact_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `instagram_handle.ilike.%${searchLike}%,display_name.ilike.%${searchLike}%`,
    );
  }
  if (status) query = query.eq("status", status);
  if (tag) query = query.contains("tags", [tag]);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customers: Customer[] = (data ?? []).map(rowToCustomer);
  return NextResponse.json({
    customers,
    totalCount: count ?? customers.length,
    mock: false,
  });
}

/**
 * POST /api/customers — 顧客レコードを新規作成または名寄せ更新(=upsert)
 *
 * Body: { instagramHandle, displayName?, profileImageUrl?, ... }
 * 用途:Instagram Graph API 経由で新規コメント取得時、まずこのAPIで顧客レコードを upsert する。
 */
export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: Partial<Customer> & { instagramHandle: string };
  try {
    body = (await req.json()) as Partial<Customer> & {
      instagramHandle: string;
    };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.instagramHandle) {
    return NextResponse.json(
      { error: "instagramHandle required" },
      { status: 400 },
    );
  }

  // Phase 3 Wave-B 修正:input validation
  if (body.instagramHandle.length > 30 ||
      !/^[A-Za-z0-9._]+$/.test(body.instagramHandle)) {
    return NextResponse.json(
      { error: "invalid instagramHandle" },
      { status: 400 },
    );
  }
  if (body.displayName && body.displayName.length > 80) {
    return NextResponse.json(
      { error: "displayName too long" },
      { status: 400 },
    );
  }
  if (
    body.autoReplyEnabled !== undefined &&
    typeof body.autoReplyEnabled !== "boolean"
  ) {
    return NextResponse.json(
      { error: "autoReplyEnabled must be boolean" },
      { status: 400 },
    );
  }
  // 許可されたタグのみ受け付け(=Critical C6-E)
  const ALLOWED_TAGS = ["VIP", "既存顧客", "問い合わせ多", "新規", "リピーター", "クレーム経験"];
  const sanitizedTags = body.tags
    ? body.tags.filter((tag) => ALLOWED_TAGS.includes(tag)).slice(0, 6)
    : undefined;
  // status は schema CHECK 制約で守られているが、念のため明示
  const ALLOWED_STATUS = ["new", "active", "vip", "follow_up", "closed"];
  const sanitizedStatus = body.status && ALLOWED_STATUS.includes(body.status)
    ? body.status
    : undefined;

  const sb = await createSupabaseServer();
  if (!sb) {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: `mock-${Date.now()}`,
      instagramHandle: body.instagramHandle,
      displayName: body.displayName ?? body.instagramHandle,
      profileImageUrl: body.profileImageUrl ?? "/avatars/user-1.svg",
      firstContactAt: now,
      lastContactAt: now,
      totalInteractions: 0,
      tags: body.tags ?? ["新規"],
      status: body.status ?? "new",
      autoReplyEnabled: body.autoReplyEnabled ?? true,
    };
    return NextResponse.json({ customer, mock: true });
  }

  const now = new Date().toISOString();

  // upsert で既存行の first_contact_at/tags/status/auto_reply_enabled が上書きされる問題への対策:
  // 1) 既存行があるか先に check → ある場合は更新対象を絞る
  // 2) ない場合のみ INSERT で初期値を渡す
  const { data: existing } = await sb
    .from("customers")
    .select("id, first_contact_at")
    .eq("user_id", auth.userId)
    .eq("instagram_handle", body.instagramHandle)
    .maybeSingle();

  let data: CustomerRow | null = null;
  let error: { message: string } | null = null;

  if (existing) {
    // 既存行:profile/last_contact のみ更新、first_contact_at/tags/status は触らない
    const res = await sb
      .from("customers")
      .update({
        display_name: body.displayName ?? undefined,
        profile_image_url: body.profileImageUrl ?? undefined,
        last_contact_at: now,
        notes: body.notes ?? undefined,
        age_range: body.ageRange ?? undefined,
        gender: body.gender ?? undefined,
        region: body.region ?? undefined,
      })
      .eq("id", existing.id)
      .select()
      .single();
    data = res.data as CustomerRow | null;
    error = res.error;
  } else {
    // 新規行:全フィールドを初期化(=sanitized 値を使用)
    const res = await sb
      .from("customers")
      .insert({
        user_id: auth.userId,
        instagram_handle: body.instagramHandle,
        display_name: body.displayName ?? body.instagramHandle,
        profile_image_url: body.profileImageUrl,
        first_contact_at: now,
        last_contact_at: now,
        tags: sanitizedTags ?? ["新規"],
        status: sanitizedStatus ?? "new",
        auto_reply_enabled: body.autoReplyEnabled ?? true,
        notes: body.notes,
        age_range: body.ageRange,
        gender: body.gender,
        region: body.region,
      })
      .select()
      .single();
    data = res.data as CustomerRow | null;
    error = res.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "no row" }, { status: 500 });
  return NextResponse.json({ customer: rowToCustomer(data), mock: false });
}

// DB行 → Customer 型のマッピング
type CustomerRow = {
  id: string;
  instagram_handle: string;
  display_name: string | null;
  profile_image_url: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  total_interactions: number | null;
  tags: string[] | null;
  status: Customer["status"];
  auto_reply_enabled: boolean | null;
  notes?: string | null;
  age_range: Customer["ageRange"] | null;
  gender: Customer["gender"] | null;
  region: string | null;
};

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    instagramHandle: row.instagram_handle,
    displayName: row.display_name ?? row.instagram_handle,
    profileImageUrl: row.profile_image_url ?? "/avatars/user-1.svg",
    firstContactAt: row.first_contact_at ?? new Date().toISOString(),
    lastContactAt: row.last_contact_at ?? new Date().toISOString(),
    totalInteractions: row.total_interactions ?? 0,
    tags: (row.tags ?? []) as Customer["tags"],
    status: row.status,
    autoReplyEnabled: row.auto_reply_enabled ?? true,
    notes: row.notes ?? undefined,
    ageRange: row.age_range ?? undefined,
    gender: row.gender ?? undefined,
    region: row.region ?? undefined,
  };
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
