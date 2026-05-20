/**
 * GET /api/auth/tiktok/start
 * TikTok OAuth フロー開始(=Instagram と同型)。
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasTikTok } from "@/lib/env";
import { buildTikTokOAuthUrl } from "@/lib/tiktok";
import { requireUser } from "@/lib/supabase/requireUser";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!hasTikTok()) {
    return NextResponse.json(
      {
        error:
          "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_OAUTH_REDIRECT が未設定です",
      },
      { status: 503 },
    );
  }

  const state = randomBytes(24).toString("hex");
  const url = buildTikTokOAuthUrl(state);
  const res = NextResponse.redirect(url);
  // Phase 3 Wave-B 修正:state cookie に user_id をバインド
  res.cookies.set("tt_oauth_state", `${state}.${auth.userId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
