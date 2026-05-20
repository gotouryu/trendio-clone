/**
 * GET /api/auth/instagram/start
 *
 * Instagram OAuth フローの開始点。
 *  1. CSRF 対策の state (=暗号学的乱数) を生成
 *  2. httpOnly cookie に state を保存(=callback で照合)
 *  3. Meta OAuth ダイアログへリダイレクト
 *
 * 環境変数 META_APP_ID / META_APP_SECRET / META_OAUTH_REDIRECT を設定すれば
 * このルート経由でログイン → callback で sns_accounts upsert → settings に戻る。
 * 未設定なら 503 を返してフォールバック。
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasMeta } from "@/lib/env";
import { buildInstagramOAuthUrl } from "@/lib/instagram";
import { requireUser } from "@/lib/supabase/requireUser";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!hasMeta()) {
    return NextResponse.json(
      {
        error: "META_APP_ID / META_APP_SECRET / META_OAUTH_REDIRECT が未設定です",
      },
      { status: 503 },
    );
  }

  const state = randomBytes(24).toString("hex");
  const url = buildInstagramOAuthUrl(state);
  const res = NextResponse.redirect(url);
  // state を httpOnly cookie に保存。SameSite=Lax で Meta からの戻りリクエストでも送られる。
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
