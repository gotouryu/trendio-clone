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
import { requireUser } from "@/lib/supabase/requireUser";
import { assertSameOrigin } from "@/lib/csrf";
import { consumeRateLimit } from "@/lib/rateLimit";

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
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (
    (body.platform !== "instagram" && body.platform !== "tiktok") ||
    !body.kpi ||
    typeof body.kpi.followers !== "number" ||
    typeof body.kpi.profileViews !== "number" ||
    typeof body.kpi.totalImpressions !== "number" ||
    typeof body.kpi.totalReach !== "number" ||
    !body.gender ||
    typeof body.gender.female !== "number" ||
    typeof body.gender.male !== "number" ||
    typeof body.gender.other !== "number"
  ) {
    return NextResponse.json({ error: "invalid report payload" }, { status: 400 });
  }

  // 入力長制限(=配列の要素数を制限してトークン爆発防止)
  body.actionTrend = Array.isArray(body.actionTrend) ? body.actionTrend.slice(0, 60) : [];
  body.regions = Array.isArray(body.regions) ? body.regions.slice(0, 30) : [];
  body.hourly = Array.isArray(body.hourly) ? body.hourly.slice(0, 24) : [];

  // H3 対応:AI レポート生成のレートリミット(=1分間 2 回、=最大トークン消費)
  const rl = await consumeRateLimit({
    userId: auth.userId,
    kind: "ai_report",
    windowSec: 60,
    maxInWindow: 2,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `AI レポート生成は1分に2回までです。あと ${rl.retryAfterSec} 秒お待ちください。`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

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
    if (!markdown.trim()) {
      return NextResponse.json({
        markdown: mockReport(body),
        mock: true,
        warning: "AI_EMPTY_RESPONSE_FALLBACK",
      });
    }
    return NextResponse.json({ markdown, mock: false });
  } catch {
    // 内部エラー詳細はクライアントに返さない(=SDK 内部情報漏洩防止)
    return NextResponse.json({
      markdown: mockReport(body),
      mock: true,
      warning: "AI_REPORT_FALLBACK",
    });
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
