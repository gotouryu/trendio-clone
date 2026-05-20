/**
 * GET /api/auth/instagram/callback?code=...&state=...
 *
 * Meta OAuth の戻り口。
 *  1. state 照合(=httpOnly cookie と一致)
 *  2. code → user access_token 交換
 *  3. me/accounts から該当ページの page_access_token + ig_user_id 取得
 *  4. sns_accounts に upsert(=user_id, platform='instagram')
 *  5. /settings?connected=instagram にリダイレクト
 *
 * エラー時は /settings?error=<reason> に戻す。
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasMeta } from "@/lib/env";
import {
  exchangeCodeForToken,
  getInstagramBusinessAccountId,
} from "@/lib/instagram";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/requireUser";

export const runtime = "nodejs";

function redirectSettings(req: NextRequest, params: Record<string, string>) {
  const base = req.nextUrl.origin;
  const url = new URL("/settings", base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url);
  // 使い切りの state cookie をクリア
  res.cookies.set("ig_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!hasMeta()) return redirectSettings(req, { error: "meta_not_configured" });

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("ig_oauth_state")?.value;
  const errParam = req.nextUrl.searchParams.get("error");

  // Phase 3 Wave-B 修正:既知のエラー値のみ通す(=反射 XSS 余地を塞ぐ)
  const ALLOWED_ERRORS = new Set([
    "access_denied",
    "missing_code",
    "state_mismatch",
    "user_mismatch",
    "token_exchange_failed",
    "no_ig_business_account",
    "db_upsert_failed",
    "meta_not_configured",
    "supabase_not_configured",
  ]);
  if (errParam) {
    const safe = ALLOWED_ERRORS.has(errParam) ? errParam : "unknown";
    return redirectSettings(req, { error: safe });
  }
  if (!code || !state) return redirectSettings(req, { error: "missing_code" });
  if (!stateCookie) return redirectSettings(req, { error: "state_mismatch" });

  // cookie 値は `state.userId` 形式。state 一致 + userId 一致 の両方を要求
  const [cookieState, cookieUserId] = stateCookie.split(".");
  if (state !== cookieState)
    return redirectSettings(req, { error: "state_mismatch" });
  if (!cookieUserId || cookieUserId !== auth.userId)
    return redirectSettings(req, { error: "user_mismatch" });

  let userAccessToken: string;
  try {
    userAccessToken = await exchangeCodeForToken(code);
  } catch {
    return redirectSettings(req, { error: "token_exchange_failed" });
  }

  const igInfo = await getInstagramBusinessAccountId(userAccessToken);
  if (!igInfo) {
    return redirectSettings(req, { error: "no_ig_business_account" });
  }

  const sb = await createSupabaseServer();
  if (!sb) return redirectSettings(req, { error: "supabase_not_configured" });

  // sns_accounts に upsert(=既存接続があれば access_token 更新、なければ新規作成)
  const { error: upsertErr } = await sb
    .from("sns_accounts")
    .upsert(
      {
        user_id: auth.userId,
        platform: "instagram",
        external_account_id: igInfo.igUserId,
        access_token: userAccessToken,
        display_name: igInfo.pageId,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );

  if (upsertErr) {
    return redirectSettings(req, { error: "db_upsert_failed" });
  }

  return redirectSettings(req, { connected: "instagram" });
}
