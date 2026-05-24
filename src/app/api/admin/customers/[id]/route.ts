import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceUserRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Params = { id: string };

/** Cache-Control: no-store を付ける NextResponse(=パスワードレスポンスのキャッシュ防止) */
function noStoreJson(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("Pragma", "no-cache");
  return res;
}

// PATCH /api/admin/customers/:id — suspend/resume or reset password
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "admin_customer_action",
    windowSec: 60,
    maxInWindow: 20,
  });
  if (rateLimit) return rateLimit;

  const { id } = await ctx.params;
  let body: {
    action: "suspend" | "resume" | "reset-password";
  };
  try {
    body = (await req.json()) as {
      action: "suspend" | "resume" | "reset-password";
    };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const admin = createSupabaseAdmin();

  if (body.action === "suspend" || body.action === "resume") {
    // Phase 3 Wave-B 修正:admin の self-suspend 防止
    if (body.action === "suspend" && id === auth.userId) {
      return NextResponse.json(
        { error: "Cannot suspend yourself" },
        { status: 403 },
      );
    }
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
    // Phase 3 Wave-B:Cache-Control: no-store でパスワードを CDN/proxy にキャッシュさせない
    return noStoreJson({ ok: true, newPassword });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/admin/customers/:id — permanently delete a customer
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "admin_customer_delete",
    windowSec: 60,
    maxInWindow: 5,
  });
  if (rateLimit) return rateLimit;

  const { id } = await ctx.params;

  // Phase 3 Wave-B 修正:admin の self-delete 防止 + admin 全削除防止
  if (id === auth.userId) {
    return NextResponse.json(
      { error: "Cannot delete self" },
      { status: 403 },
    );
  }

  const admin = createSupabaseAdmin();

  // 削除対象の role を確認(=admin は削除不可)
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  if (!target) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 },
    );
  }
  if (target.role === "admin") {
    return NextResponse.json(
      { error: "Cannot delete an admin user" },
      { status: 403 },
    );
  }

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
