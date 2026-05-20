/**
 * GET /api/instagram/insights
 *
 * Instagram Graph API の insights を取得する。
 *  - 認証済みユーザーの sns_accounts(platform='instagram')に保存された
 *    long-lived access_token を使用(=OAuth 接続済の前提)
 *  - クエリ ?igUserId & ?accessToken を渡せばオーバーライド可(=テスト用)
 *  - Meta env / 接続レコード / トークンいずれか欠ければ mockKPI を返す(=画面が壊れない)
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasMeta } from "@/lib/env";
import { fetchInsights, getInstagramBusinessAccountId } from "@/lib/instagram";
import { mockKPI } from "@/lib/mockData";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;
  // Phase 3 Wave-B 修正:本番では accessToken クエリオーバーライドを禁止
  // (=URL に長期トークンが残ると CDN/proxy ログから漏洩する)
  const allowOverride = process.env.NODE_ENV !== "production";
  let igUserId = allowOverride ? searchParams.get("igUserId") : null;
  let accessToken = allowOverride ? searchParams.get("accessToken") : null;

  // クエリで明示されていない場合は sns_accounts から取り出す
  if (!igUserId || !accessToken) {
    const sb = await createSupabaseServer();
    if (sb) {
      const { data } = await sb
        .from("sns_accounts")
        .select("access_token, external_account_id")
        .eq("user_id", auth.userId)
        .eq("platform", "instagram")
        .maybeSingle();
      if (data) {
        accessToken = data.access_token;
        igUserId = data.external_account_id;
      }
    }
  }

  if (!hasMeta() || !igUserId || !accessToken) {
    return NextResponse.json({ ...mockKPI, mock: true });
  }

  try {
    // user access_token を渡してきた場合は ig_user_id を都度取り直す
    // (=保存値が古い/不整合の時のフェイルセーフ)
    const data = await fetchInsights(igUserId, accessToken, since, until);
    return NextResponse.json({ ...data, mock: false });
  } catch {
    // 失敗時は user access_token として再解釈し ig_user_id を取り直して再試行
    try {
      const igInfo = await getInstagramBusinessAccountId(accessToken);
      if (!igInfo) throw new Error("no_ig_business_account");
      const data = await fetchInsights(
        igInfo.igUserId,
        accessToken,
        since,
        until,
      );
      return NextResponse.json({ ...data, mock: false });
    } catch (e) {
      return NextResponse.json(
        {
          ...mockKPI,
          mock: true,
          error: e instanceof Error ? e.message : "Instagram fetch failed",
        },
      );
    }
  }
}
