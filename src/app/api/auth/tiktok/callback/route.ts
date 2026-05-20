/**
 * GET /api/auth/tiktok/callback?code=...&state=...
 * TikTok OAuth 戻り口。
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasTikTok } from "@/lib/env";
import { exchangeTikTokCode } from "@/lib/tiktok";
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

  if (errParam) return redirectSettings(req, { error: errParam });
  if (!code || !state) return redirectSettings(req, { error: "missing_code" });
  if (!stateCookie || state !== stateCookie)
    return redirectSettings(req, { error: "state_mismatch" });

  let tok: Awaited<ReturnType<typeof exchangeTikTokCode>>;
  try {
    tok = await exchangeTikTokCode(code);
  } catch {
    return redirectSettings(req, { error: "token_exchange_failed" });
  }

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
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );

  if (upsertErr) return redirectSettings(req, { error: "db_upsert_failed" });

  return redirectSettings(req, { connected: "tiktok" });
}
