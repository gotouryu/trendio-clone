/**
 * GET   /api/customers/[id] — 顧客詳細
 * PATCH /api/customers/[id] — 顧客情報の更新(tags / status / notes 等)
 *
 * 共P-01「顧客カルテ」要件:個別顧客の詳細表示と編集
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";
import { mockCustomers } from "@/lib/mockData";
import type { Customer } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const sb = await createSupabaseServer();
  if (!sb || !UUID_RE.test(id)) {
    const customer = mockCustomers.find((c) => c.id === id);
    if (!customer)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ customer, mock: true });
  }

  const { data, error } = await sb
    .from("customer_overview_v")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({ customer: rowToCustomer(data), mock: false });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  let body: Partial<Customer>;
  try {
    body = (await req.json()) as Partial<Customer>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sb = await createSupabaseServer();
  if (!sb || !UUID_RE.test(id)) {
    const customer = mockCustomers.find((c) => c.id === id);
    if (!customer)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    Object.assign(customer, body);
    return NextResponse.json({ customer, mock: true });
  }

  // Phase 4 修正(C3):POST 側と同じ tags/status sanitize を PATCH にも適用
  const ALLOWED_TAGS = [
    "VIP",
    "既存顧客",
    "問い合わせ多",
    "新規",
    "リピーター",
    "クレーム経験",
  ];
  const ALLOWED_STATUS = ["new", "active", "vip", "follow_up", "closed"];

  const payload: Record<string, unknown> = {};
  if (body.displayName !== undefined) {
    if (typeof body.displayName === "string" && body.displayName.length <= 80) {
      payload.display_name = body.displayName;
    }
  }
  if (body.tags !== undefined && Array.isArray(body.tags)) {
    payload.tags = body.tags
      .filter((tag) => ALLOWED_TAGS.includes(tag))
      .slice(0, 6);
  }
  if (body.status !== undefined && ALLOWED_STATUS.includes(body.status)) {
    payload.status = body.status;
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
  if (body.autoReplyEnabled !== undefined)
    payload.auto_reply_enabled = body.autoReplyEnabled;
  if (
    body.notes !== undefined &&
    typeof body.notes === "string" &&
    body.notes.length <= 2000
  ) {
    payload.notes = body.notes;
  }
  if (body.ageRange !== undefined) payload.age_range = body.ageRange;
  if (body.gender !== undefined) payload.gender = body.gender;
  if (
    body.region !== undefined &&
    typeof body.region === "string" &&
    body.region.length <= 50
  ) {
    payload.region = body.region;
  }

  const { data, error } = await sb
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: rowToCustomer(data), mock: false });
}

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
