import { NextResponse, type NextRequest } from "next/server";
import { hasTikTok } from "@/lib/env";
import { fetchTikTokUserStats } from "@/lib/tiktok";
import { requireUser } from "@/lib/supabase/requireUser";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get("accessToken");

  if (!hasTikTok() || !accessToken) {
    return NextResponse.json({
      followers: 0,
      likes: 0,
      videoViews: 0,
      profileViews: 0,
      mock: true,
    });
  }
  try {
    const stats = await fetchTikTokUserStats(accessToken);
    return NextResponse.json({ ...stats, mock: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "TikTok fetch failed" },
      { status: 500 },
    );
  }
}
