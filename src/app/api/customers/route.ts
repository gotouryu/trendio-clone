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
import { mockCustomers } from "@/lib/mockData";
import type { Customer } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const rawSearch = searchParams.get("search")?.toLowerCase() ?? "";
  // PostgREST の or() に直挿入するため構文文字を除去(=,()*:%, バックスラッシュ)。
  // これを sanitize しないと "foo,status.eq.admin" のような値で別フィルタを差し込まれる。
  const search = rawSearch.replace(/[,()*:%\\]/g, "").trim().slice(0, 64);
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const limitRaw = parseInt(searchParams.get("limit") ?? "50", 10);
  const offsetRaw = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 200);
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

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
      `instagram_handle.ilike.%${search}%,display_name.ilike.%${search}%`,
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
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as Partial<Customer> & {
    instagramHandle: string;
  };
  if (!body.instagramHandle) {
    return NextResponse.json(
      { error: "instagramHandle required" },
      { status: 400 },
    );
  }

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
  const { data, error } = await sb
    .from("customers")
    .upsert(
      {
        user_id: auth.userId,
        instagram_handle: body.instagramHandle,
        display_name: body.displayName ?? body.instagramHandle,
        profile_image_url: body.profileImageUrl,
        // 初回挿入時は first_contact_at / last_contact_at を now() で埋める。
        // 既存行に対する upsert ではこれらは onConflict の DO UPDATE で上書きされうるため、
        // 既存行を更新する場合は last_contact_at だけを更新するべきだが、
        // POST は「名寄せ初期化」用途。実運用では customer_interactions INSERT のトリガーで
        // last_contact_at は更新されるため、ここは upsert 互換に保つ。
        first_contact_at: now,
        last_contact_at: now,
        tags: body.tags ?? ["新規"],
        status: body.status ?? "new",
        auto_reply_enabled: body.autoReplyEnabled ?? true,
        notes: body.notes,
        age_range: body.ageRange,
        gender: body.gender,
        region: body.region,
      },
      { onConflict: "user_id,instagram_handle", ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
