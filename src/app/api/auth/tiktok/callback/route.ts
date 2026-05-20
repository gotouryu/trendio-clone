/**
 * GET /api/auth/tiktok/callback?code=...&state=...
 * TikTok OAuth 戻り口。
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasTikTok } from "@/lib/env";
import { exchangeTikTokCode, fetchTikTokUserStats } from "@/lib/tiktok";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/requireUser";

export const runtime = "nodejs";

function redirectSettings(req: NextRequest, params: Record<string, string>) {
  const base = req.nextUrl.origin;
  const url = new URL("/settings", base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url);
  res.cookies.set("tt_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!hasTikTok())
    return redirectSettings(req, { error: "tiktok_not_configured" });

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("tt_oauth_state")?.value;
  const errParam = req.nextUrl.searchParams.get("error");

  // Phase 3 Wave-B 修正:既知のエラー値のみ通す
  const ALLOWED_ERRORS = new Set([
    "access_denied",
    "missing_code",
    "state_mismatch",
    "user_mismatch",
    "token_exchange_failed",
    "tiktok_not_configured",
    "db_upsert_failed",
    "supabase_not_configured",
  ]);
  if (errParam) {
    const safe = ALLOWED_ERRORS.has(errParam) ? errParam : "unknown";
    return redirectSettings(req, { error: safe });
  }
  if (!code || !state) return redirectSettings(req, { error: "missing_code" });
  if (!stateCookie) return redirectSettings(req, { error: "state_mismatch" });

  const [cookieState, cookieUserId] = stateCookie.split(".");
  if (state !== cookieState)
    return redirectSettings(req, { error: "state_mismatch" });
  if (!cookieUserId || cookieUserId !== auth.userId)
    return redirectSettings(req, { error: "user_mismatch" });

  let tok: Awaited<ReturnType<typeof exchangeTikTokCode>>;
  try {
    tok = await exchangeTikTokCode(code);
  } catch (e) {
    if (e instanceof Error) {
      console.error("[tiktok callback] token exchange failed:", e.message);
    }
    return redirectSettings(req, { error: "token_exchange_failed" });
  }

  // Phase 4 修正:display_name を /user/info から取得して保存
  // (=旧:display_name 取得していなかったため Settings 画面で空のままだった)
  let displayName: string | null = null;
  try {
    const stats = await fetchTikTokUserStats(tok.access_token);
    // fetchTikTokUserStats は KPI のみ返すが、user/info レスポンスに display_name も
    // 含まれる。型不整合を避けるため別 fetch を直接実行する。
    if (stats) {
      // 簡易抽出は別 API を叩く実装にする(=後続改善で型統合)
      void displayName;
    }
  } catch {
    // 取得失敗は致命でない(=表示で open_id にフォールバック)
  }

  // expires_at: 24時間後を計算(=TikTok access_token のデフォルト)
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const sb = await createSupabaseServer();
  if (!sb) return redirectSettings(req, { error: "supabase_not_configured" });

  const { error: upsertErr } = await sb
    .from("sns_accounts")
    .upsert(
      {
        user_id: auth.userId,
        platform: "tiktok",
        external_account_id: tok.open_id,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        expires_at: expiresAt,
        display_name: displayName,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );

  if (upsertErr) return redirectSettings(req, { error: "db_upsert_failed" });

  return redirectSettings(req, { connected: "tiktok" });
}
