import { NextResponse, type NextRequest } from "next/server";
import { hasAnthropic } from "@/lib/env";
import { runClaude } from "@/lib/claudeClient";
import { mockContentIdeas } from "@/lib/mockData";
import type { ContentIdea } from "@/lib/types";
import { requireUser } from "@/lib/supabase/requireUser";
import { assertSameOrigin } from "@/lib/csrf";
import { consumeRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Body = {
  industry: string;
  goal: string;
  extra?: string;
  platform?: "instagram" | "tiktok" | "both";
};

const MAX_FIELD = 500; // 1フィールドあたり最大500文字(=Claude トークン爆発防止)

const SYSTEM_PROMPT = `あなたは経験豊富なSNSマーケターです。Instagram と TikTok の運用知識を持ち、視聴者の心理を理解しています。

ユーザーから「業界」「マーケティング目的」「追加要望」を受け取り、3つのコンテンツアイデアを JSON 配列で返してください。

各アイデアは以下のフィールドを持ちます:
- title: 短いタイトル(30文字以内)
- hook: 視聴者の興味を惹くオープニング(60文字以内)
- script: 構成台本(箇条書き、改行で区切る)
- hashtags: ハッシュタグ配列(3〜5個、# は含めない)
- platform: "instagram" または "tiktok"

出力は厳密に以下のJSON形式のみ。前置きや解説は一切付けないこと:
[
  {"title":"...","hook":"...","script":"...","hashtags":["...","..."],"platform":"instagram"},
  ...
]`;

export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // H3 対応:AI コンテンツ生成のレートリミット(=1分間 3 回、=トークン消費大)
  const rl = await consumeRateLimit({
    userId: auth.userId,
    kind: "ai_content",
    windowSec: 60,
    maxInWindow: 3,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `AI コンテンツ生成は1分に3回までです。あと ${rl.retryAfterSec} 秒お待ちください。`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // 入力長制限(=Claude トークン爆発防止)
  const industry = String(body.industry ?? "").slice(0, MAX_FIELD);
  const goal = String(body.goal ?? "").slice(0, MAX_FIELD);
  const extra = String(body.extra ?? "").slice(0, MAX_FIELD);
  const platform: "instagram" | "tiktok" | "both" =
    body.platform === "instagram" || body.platform === "tiktok" || body.platform === "both"
      ? body.platform
      : "both";

  if (!industry || !goal) {
    return NextResponse.json({ error: "industry and goal are required" }, { status: 400 });
  }

  if (!hasAnthropic()) {
    // Fall back to mock so the UI flow remains demonstrable without API key
    return NextResponse.json({
      ideas: mockContentIdeas.map((c) => ({ ...c, id: `mock-${Date.now()}-${c.id}` })),
      mock: true,
    });
  }

  const userPrompt = `業界: ${industry}
マーケティング目的: ${goal}
追加要望: ${extra || "なし"}
プラットフォーム: ${platform}

上記条件で3つのコンテンツアイデアを生成してください。`;

  try {
    const raw = await runClaude({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 2048,
    });
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(cleaned) as Omit<ContentIdea, "id">[];
    const ideas: ContentIdea[] = parsed.map((p, i) => ({
      ...p,
      id: `gen-${Date.now()}-${i}`,
    }));
    return NextResponse.json({ ideas, mock: false });
  } catch {
    // 内部エラー詳細はクライアントに返さない(=SDK 内部情報漏洩防止)
    return NextResponse.json(
      { error: "Generation failed", ideas: [] },
      { status: 500 },
    );
  }
}
