import { NextResponse, type NextRequest } from "next/server";
import { hasMeta } from "@/lib/env";
import { fetchInsights } from "@/lib/instagram";
import { mockKPI } from "@/lib/mockData";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const igUserId = searchParams.get("igUserId");
  const accessToken = searchParams.get("accessToken");
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;

  if (!hasMeta() || !igUserId || !accessToken) {
    return NextResponse.json({ ...mockKPI, mock: true });
  }
  try {
    const data = await fetchInsights(igUserId, accessToken, since, until);
    return NextResponse.json({ ...data, mock: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Instagram fetch failed" },
      { status: 500 },
    );
  }
}
