import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export const runtime = "nodejs";

type Params = { id: string };

// PATCH /api/admin/customers/:id — suspend/resume or reset password
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: "suspend" | "resume" | "reset-password";
  };
  const admin = createSupabaseAdmin();

  if (body.action === "suspend" || body.action === "resume") {
    const status = body.action === "suspend" ? "suspended" : "active";
    const { error } = await admin
      .from("profiles")
      .update({ status })
      .eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status });
  }

  if (body.action === "reset-password") {
    const newPassword = generatePassword(12);
    const { error } = await admin.auth.admin.updateUserById(id, {
      password: newPassword,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, newPassword });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/admin/customers/:id — permanently delete a customer
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function generatePassword(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
