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
import { enforceUserRateLimit } from "@/lib/rateLimit";
import { mockCustomers } from "@/lib/mockData";
import type { Customer } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_TAGS = [
  "VIP",
  "既存顧客",
  "問い合わせ多",
  "新規",
  "リピーター",
  "クレーム経験",
] as const;
const ALLOWED_STATUS = ["new", "active", "vip", "follow_up", "closed"] as const;
const ALLOWED_AGE_RANGES = ["13-17", "18-24", "25-34", "35-44", "45+"] as const;
const ALLOWED_GENDERS = ["female", "male", "other"] as const;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "customer_update",
    windowSec: 60,
    maxInWindow: 120,
  });
  if (rateLimit) return rateLimit;
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

  if (error) return NextResponse.json({ error: "customer_fetch_failed" }, { status: 500 });
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
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "customer_detail_update",
    windowSec: 60,
    maxInWindow: 60,
  });
  if (rateLimit) return rateLimit;
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

  const payload: Record<string, unknown> = {};
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || body.displayName.length > 80) {
      return NextResponse.json({ error: "displayName too long" }, { status: 400 });
    }
    payload.display_name = body.displayName;
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return NextResponse.json({ error: "tags must be array" }, { status: 400 });
    }
    payload.tags = body.tags
      .filter((tag) => ALLOWED_TAGS.includes(tag))
      .slice(0, 6);
  }
  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status)) {
      return NextResponse.json({ error: "status is invalid" }, { status: 400 });
    }
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
  if (body.profileImageUrl !== undefined) {
    const profileImageUrl = validateOptionalTextUrl(body.profileImageUrl, 500);
    if (!profileImageUrl.ok) return profileImageUrl.response;
    payload.profile_image_url = profileImageUrl.value;
  }
  if (body.notes !== undefined) {
    const notes = validateOptionalText(body.notes, "notes", 2000);
    if (!notes.ok) return notes.response;
    payload.notes = notes.value;
  }
  if (body.ageRange !== undefined) {
    const ageRange = validateOptionalEnum(body.ageRange, "ageRange", ALLOWED_AGE_RANGES);
    if (!ageRange.ok) return ageRange.response;
    payload.age_range = ageRange.value;
  }
  if (body.gender !== undefined) {
    const gender = validateOptionalEnum(body.gender, "gender", ALLOWED_GENDERS);
    if (!gender.ok) return gender.response;
    payload.gender = gender.value;
  }
  if (body.region !== undefined) {
    const region = validateOptionalText(body.region, "region", 50);
    if (!region.ok) return region.response;
    payload.region = region.value;
  }

  const { data, error } = await sb
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Customer update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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

function validateOptionalText(
  value: unknown,
  field: string,
  maxLength: number,
):
  | { ok: true; value: string | undefined }
  | { ok: false; response: NextResponse } {
  if (value === null) return { ok: true, value: undefined };
  if (typeof value !== "string" || value.length > maxLength) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${field} must be a string up to ${maxLength} chars` },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value };
}

function validateOptionalTextUrl(
  value: unknown,
  maxLength: number,
):
  | { ok: true; value: string | undefined }
  | { ok: false; response: NextResponse } {
  const text = validateOptionalText(value, "profileImageUrl", maxLength);
  if (!text.ok || !text.value) return text;
  if (text.value.startsWith("/")) return text;
  try {
    const url = new URL(text.value);
    if (url.protocol === "http:" || url.protocol === "https:") return text;
  } catch {
    // handled below
  }
  return {
    ok: false,
    response: NextResponse.json(
      { error: "profileImageUrl must be http(s) or relative path" },
      { status: 400 },
    ),
  };
}

function validateOptionalEnum<T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
):
  | { ok: true; value: T[number] | undefined }
  | { ok: false; response: NextResponse } {
  if (value === null) return { ok: true, value: undefined };
  if (typeof value === "string" && allowed.includes(value)) {
    return { ok: true, value };
  }
  return {
    ok: false,
    response: NextResponse.json({ error: `${field} is invalid` }, { status: 400 }),
  };
}
