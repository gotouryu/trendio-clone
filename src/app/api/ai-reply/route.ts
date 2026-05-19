/**
 * POST /api/ai-reply
 *
 * AI返信案を生成する(=機能① AI顧客応答機能の手動承認モード)。
 * 共P-01「顧客対応の自動化」要件への直接対応。
 *
 * Body: { commentId?: string, commentText: string, customerHandle?: string, customerHistory?: string }
 * Response: { reply: string, model: string, generated: boolean }
 *
 * Anthropic API キー未設定時は、ローカルのテンプレ応答を返す(=デモ用)。
 */
import { NextResponse, type NextRequest } from "next/server";
import { hasAnthropic } from "@/lib/env";
import { runClaude } from "@/lib/claudeClient";
import { requireUser } from "@/lib/supabase/requireUser";

export const runtime = "nodejs";

type Body = {
  commentId?: string;
  commentText: string;
  customerHandle?: string;
  customerHistory?: string; // 過去のやり取り(オプション、顧客カルテから渡す)
  tone?: "polite" | "friendly" | "professional";
};

const SYSTEM_PROMPT = `あなたは中小企業の顧客対応マネージャーです。Instagram のコメントに対し、丁寧で親しみやすく、ブランドの信頼を高める返信文を日本語で1つ生成してください。

# 守るべきルール
- 必ず日本語で返信(=お客様への返信のみ、説明文や前置きは付けない)
- 最大3文程度、絵文字は1つまで
- 商品の決定・契約成立・金銭授受を約束する表現は禁止(=Human-in-the-Loop原則、最終確認は人間が行う)
- 不明な事項は「担当よりDMにてご連絡いたします」と返す
- クレーム・返金・法的な内容に該当しそうな場合は、機械的な応答を避け「担当より個別にご連絡いたします」と返す
- 返信文だけを出力(=「以下の返信文を提案します:」のような前置き禁止)`;

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as Body;
  if (!body.commentText || typeof body.commentText !== "string") {
    return NextResponse.json(
      { error: "commentText is required" },
      { status: 400 },
    );
  }

  // フォールバック:Anthropic未設定時は簡易テンプレ
  if (!hasAnthropic()) {
    const reply = fallbackReply(body.commentText);
    return NextResponse.json({
      reply,
      model: "fallback-template",
      generated: false,
    });
  }

  const userPrompt = [
    body.customerHandle ? `顧客ハンドル: @${body.customerHandle}` : "",
    body.customerHistory ? `過去のやり取り:\n${body.customerHistory}` : "",
    `今回のコメント本文:\n${body.commentText}`,
    `\n上記コメントへの返信文を日本語で1つだけ生成してください。`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const raw = await runClaude({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 512,
    });
    const reply = raw.trim();
    return NextResponse.json({
      reply,
      model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
      generated: true,
    });
  } catch (err) {
    // 失敗時はフォールバックでサービス継続(=可用性優先)
    return NextResponse.json({
      reply: fallbackReply(body.commentText),
      model: "fallback-template",
      generated: false,
      error: err instanceof Error ? err.message : "AI generation failed",
    });
  }
}

/**
 * 簡易テンプレ応答(Claude API未設定時のフォールバック)
 * キーワードに応じた定型応答を返す。
 */
function fallbackReply(text: string): string {
  const t = text.toLowerCase();
  if (text.includes("営業時間") || t.includes("open"))
    return "お問い合わせありがとうございます。営業時間は平日10:00〜18:00です。詳細はDMにてご案内いたします😊";
  if (text.includes("入荷") || text.includes("再入荷"))
    return "ご質問ありがとうございます!入荷情報は公式アカウントで随時お知らせしております。詳細はDMにてご連絡いたします。";
  if (text.includes("使い方") || text.includes("how"))
    return "ご質問ありがとうございます!商品の使い方は商品ページをご確認いただくか、DMにて詳細をお伝えします。";
  if (text.includes("価格") || text.includes("値段"))
    return "お問い合わせありがとうございます。価格詳細はDMでご案内いたします。少々お時間いただきますがご了承ください。";
  return "コメントありがとうございます!担当より順次お返事いたします。今後ともよろしくお願いいたします😊";
}
