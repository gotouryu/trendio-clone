/**
 * GET    /api/sns/accounts          — 接続中の SNS アカウント一覧(access_token は返さない)
 * DELETE /api/sns/accounts?platform=instagram  — 該当プラットフォームの接続を切断
 *
 * Settings 画面が「接続済み / 未接続」の表示と切断ボタンに使う。
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceUserRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const sb = await createSupabaseServer();
  if (!sb) return NextResponse.json({ accounts: [] });

  const { data, error } = await sb
    .from("sns_accounts")
    .select(
      "platform, external_account_id, display_name, last_synced_at, expires_at, created_at",
    )
    .eq("user_id", auth.userId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ accounts: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const rateLimit = await enforceUserRateLimit({
    userId: auth.userId,
    kind: "sns_disconnect",
    windowSec: 60,
    maxInWindow: 10,
  });
  if (rateLimit) return rateLimit;

  const platform = req.nextUrl.searchParams.get("platform");
  if (platform !== "instagram" && platform !== "tiktok") {
    return NextResponse.json(
      { error: "platform must be 'instagram' or 'tiktok'" },
      { status: 400 },
    );
  }

  const sb = await createSupabaseServer();
  if (!sb) return NextResponse.json({ ok: true });

  const { error } = await sb
    .from("sns_accounts")
    .delete()
    .eq("user_id", auth.userId)
    .eq("platform", platform);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
