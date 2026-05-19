import { NextResponse, type NextRequest } from "next/server";
import { hasAnthropic } from "@/lib/env";
import { runClaude } from "@/lib/claudeClient";
import type {
  DashboardKPI,
  ActionTrendPoint,
  GenderRatio,
  RegionItem,
  HourlyEngagement,
} from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  platform: "instagram" | "tiktok";
  period: string;
  kpi: DashboardKPI;
  actionTrend: ActionTrendPoint[];
  gender: GenderRatio;
  regions: RegionItem[];
  hourly: HourlyEngagement[];
};

const SYSTEM_PROMPT = `あなたはシニアSNSアナリストです。Instagram と TikTok の運用データを読み解き、経営者・マーケティング担当者向けに「インサイトレポート」を日本語で作成します。

レポートは以下の構成で、Markdown 形式で返してください:

## 全体サマリー
(2〜3文で要約)

## 主要KPIの所見
(フォロワー、リーチ、エンゲージメントの傾向)

## オーディエンス分析
(性別比・地域分布から見える示唆)

## 投稿時間の最適化
(時間帯エンゲージメントから推奨投稿時間)

## 改善アクション(優先順位順)
1. 〇〇
2. 〇〇
3. 〇〇

数字は根拠ベースで具体的に書く。一般論や曖昧表現は避ける。`;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;

  if (!hasAnthropic()) {
    return NextResponse.json({
      markdown: mockReport(body),
      mock: true,
    });
  }

  const userPrompt = `分析対象: ${body.platform}
集計期間: ${body.period}

KPI:
- フォロワー: ${body.kpi.followers}
- プロフィール閲覧: ${body.kpi.profileViews}
- インプレッション: ${body.kpi.totalImpressions}
- リーチ: ${body.kpi.totalReach}

行動傾向(8週):
${body.actionTrend.map((p) => `${p.date}: いいね${p.likes}, コメント${p.comments}, セーブ${p.saves}, クリック${p.clicks}`).join("\n")}

性別比(現在): 女性${body.gender.female}% / 男${body.gender.male}% / 他${body.gender.other}%

上位地域:
${body.regions.slice(0, 5).map((r) => `${r.name}: ${r.percentage}%`).join("\n")}

時間帯エンゲージメント:
${body.hourly.filter((h) => h.engagement > 0).map((h) => `${h.hour}時: ${h.engagement}`).join("\n")}

上記データから、経営判断につながる具体的なレポートを書いてください。`;

  try {
    const markdown = await runClaude({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 3000,
    });
    return NextResponse.json({ markdown, mock: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report generation failed" },
      { status: 500 },
    );
  }
}

function mockReport(body: Body): string {
  return `## 全体サマリー
${body.platform === "instagram" ? "Instagram" : "TikTok"} アカウントは現在フォロワー ${body.kpi.followers}名で、エンゲージメント率は安定推移。直近の傾向は緩やかな下降。

## 主要KPIの所見
- フォロワー数は横ばい(新規流入が伸び悩み)
- プロフィール閲覧 ${body.kpi.profileViews}回、リーチ ${body.kpi.totalReach}人
- 行動指標は「いいね」中心で、保存・クリックは伸びしろあり

## オーディエンス分析
女性 ${body.gender.female}% / 男 ${body.gender.male}% / その他 ${body.gender.other}%。最大セグメントは「その他」で、性別を公開していないユーザー層が中心。

## 投稿時間の最適化
${body.hourly
  .filter((h) => h.engagement >= 30)
  .map((h) => `${h.hour}時`)
  .join(" / ")} のエンゲージメントが高い。これらの時間帯への投稿集中を推奨。

## 改善アクション(優先順位順)
1. 保存促進フォーマット(=チェックリスト・図解)の投稿頻度を増やす
2. プロフィールリンクへの誘導CTAを各投稿末尾に追加
3. 17:00/08:00/03:00 の3枠で週次投稿スケジュールを固定化

※ このレポートは Anthropic API キー未設定時のサンプル出力です。本番運用時は Claude Sonnet 4.6 による分析が表示されます。`;
}
