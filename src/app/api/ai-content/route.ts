import { NextResponse, type NextRequest } from "next/server";
import { hasAnthropic } from "@/lib/env";
import { runClaude } from "@/lib/claudeClient";
import { mockContentIdeas } from "@/lib/mockData";
import type { ContentIdea } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  industry: string;
  goal: string;
  extra?: string;
  platform?: "instagram" | "tiktok" | "both";
};

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
  const body = (await req.json()) as Body;

  if (!hasAnthropic()) {
    // Fall back to mock so the UI flow remains demonstrable without API key
    return NextResponse.json({
      ideas: mockContentIdeas.map((c) => ({ ...c, id: `mock-${Date.now()}-${c.id}` })),
      mock: true,
    });
  }

  const userPrompt = `業界: ${body.industry}
マーケティング目的: ${body.goal}
追加要望: ${body.extra ?? "なし"}
プラットフォーム: ${body.platform ?? "both"}

上記条件で3つのコンテンツアイデアを生成してください。`;

  try {
    const raw = await runClaude({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 2048,
    });
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
    const parsed = JSON.parse(cleaned) as Omit<ContentIdea, "id">[];
    const ideas: ContentIdea[] = parsed.map((p, i) => ({
      ...p,
      id: `gen-${Date.now()}-${i}`,
    }));
    return NextResponse.json({ ideas, mock: false });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Generation failed",
        ideas: [],
      },
      { status: 500 },
    );
  }
}
