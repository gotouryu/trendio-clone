/**
 * GET /api/tiktok/insights
 *
 * TikTok user stats を取得。
 *  - 認証済みユーザーの sns_accounts(platform='tiktok')の access_token を使用
 *  - クエリ ?accessToken でオーバーライド可(=テスト用)
 *  - 未接続 / env 未設定なら 0 値で mock=true を返す
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasTikTok } from "@/lib/env";
import { fetchTikTokUserStats } from "@/lib/tiktok";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/tokenCrypto";

export const runtime = "nodejs";

const EMPTY_TIKTOK = {
  followers: 0,
  likes: 0,
  videoViews: 0,
  profileViews: 0,
};

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const allowOverride = process.env.NODE_ENV !== "production";
  let accessToken = allowOverride ? searchParams.get("accessToken") : null;

  if (!accessToken) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb
        .from("sns_accounts")
        .select("access_token")
        .eq("user_id", auth.userId)
        .eq("platform", "tiktok")
        .maybeSingle();
      if (data) {
        // H2 対応:DB に保存された access_token は暗号化済み(=enc:v1: prefix)
        try {
          accessToken = decryptToken(data.access_token);
        } catch {
          accessToken = null;
        }
      }
    }
  }

  if (!hasTikTok() || !accessToken) {
    return NextResponse.json({ ...EMPTY_TIKTOK, mock: true });
  }

  try {
    const stats = await fetchTikTokUserStats(accessToken);
    return NextResponse.json({ ...stats, mock: false });
  } catch (e) {
    return NextResponse.json({
      ...EMPTY_TIKTOK,
      mock: true,
      error: e instanceof Error ? e.message : "TikTok fetch failed",
    });
  }
}
