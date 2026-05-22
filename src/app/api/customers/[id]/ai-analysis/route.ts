/**
 * POST /api/customers/[id]/ai-analysis — AI 顧客好み分析(=共P-01 顧客理解の深化)
 *
 * 顧客の過去全コメントを集約し、Claude で「関心領域 / 対応の注意点 / サマリ」を生成。
 *
 * # 重要:LLM レート制限(=コスト+乱用防止)
 *   - 1顧客につき 1日1回まで(=24時間以内に再実行不可)
 *   - 1ユーザー全体で 1分1回まで(=連打防止)
 *
 * Response: { analysis: CustomerAIAnalysis, cached: boolean, nextAvailableAt?: string }
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/csrf";
import { hasAnthropic } from "@/lib/env";
import { runClaude } from "@/lib/claudeClient";
import { mockCustomers, mockInteractions } from "@/lib/mockData";
import type { CustomerAIAnalysis, CustomerInteraction } from "@/lib/types";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// レートリミット設定
const PER_CUSTOMER_COOLDOWN_HOURS = 24; // 1顧客につき1日1回まで
const PER_USER_COOLDOWN_SECONDS = 60; // 1ユーザー全体で1分1回まで(=連打防止)

// 入力サイズ制御(=Claude トークン超過防止)
const MAX_INTERACTIONS_FOR_AI = 50;
const MAX_CONTENT_LENGTH_PER_ITEM = 200;

const SYSTEM_PROMPT = `あなたは熟練の顧客対応マネージャーです。以下の顧客の過去の発言履歴から、3つの観点で簡潔に要約してください。

# 出力フォーマット(JSON厳守、前置きや解説禁止)
{
  "interests": "<関心領域:何に興味があるか、どんな商品を好むか。50字程度の自然文>",
  "cautions": "<対応の注意点:過去にクレームがあったか、敏感な話題は何か。50字程度の自然文>",
  "summary": "<総合サマリ:この顧客の特徴と推奨される対応方針。80字程度の自然文>"
}

# ルール
- 必ず日本語で出力
- 個人を特定する情報は含めない
- 推測ではなく履歴に書かれた事実から要約
- ポジティブ/ネガティブ両面を客観的に
- JSON 以外の文字は出力しない`;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const sb = await createSupabaseServer();

  // 1. 顧客レコード取得(=所有確認)
  let customer:
    | {
        id: string;
        instagram_handle: string;
        ai_analysis: CustomerAIAnalysis | null;
        ai_analysis_at: string | null;
      }
    | null = null;

  if (sb && UUID_RE.test(id)) {
    const { data } = await sb
      .from("customers")
      .select("id, instagram_handle, ai_analysis, ai_analysis_at")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    customer = data;
  } else {
    const mc = mockCustomers.find((c) => c.id === id);
    if (mc) {
      customer = {
        id: mc.id,
        instagram_handle: mc.instagramHandle,
        ai_analysis: null,
        ai_analysis_at: null,
      };
    }
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // 2. cache hit を最優先で評価(=24時間以内のキャッシュなら LLM を呼ばずに返す)
  // これを先にすると、cache hit で 60秒レートリミットに引っかからずに済む。
  if (customer.ai_analysis_at && customer.ai_analysis) {
    const lastAtMs = new Date(customer.ai_analysis_at).getTime();
    const hoursSince = (Date.now() - lastAtMs) / (1000 * 60 * 60);
    if (hoursSince < PER_CUSTOMER_COOLDOWN_HOURS) {
      // ランタイム検証:壊れた jsonb が入ってる可能性を避ける
      const a = customer.ai_analysis;
      if (
        typeof a.interests === "string" &&
        typeof a.cautions === "string" &&
        typeof a.summary === "string"
      ) {
        return NextResponse.json({
          analysis: a,
          cached: true,
          nextAvailableAt: new Date(
            lastAtMs + PER_CUSTOMER_COOLDOWN_HOURS * 3600 * 1000,
          ).toISOString(),
        });
      }
      // 壊れたデータなら再生成に進む
    }
  }

  // 3. cache miss:ユーザー単位レートリミット(=LLM呼び出しコスト防御、DB由来で永続化)
  // 直近 PER_USER_COOLDOWN_SECONDS 秒以内に自分の顧客で生成があれば429
  if (sb && UUID_RE.test(id)) {
    const sinceIso = new Date(
      Date.now() - PER_USER_COOLDOWN_SECONDS * 1000,
    ).toISOString();
    const { data: recent } = await sb
      .from("customers")
      .select("ai_analysis_at")
      .eq("user_id", auth.userId)
      .gt("ai_analysis_at", sinceIso)
      .order("ai_analysis_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent?.ai_analysis_at) {
      const userLastMs = new Date(recent.ai_analysis_at).getTime();
      const wait = Math.ceil(
        (userLastMs + PER_USER_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: `AI 分析は1分に1回までです。あと ${wait} 秒お待ちください。`,
          nextAvailableAt: new Date(
            userLastMs + PER_USER_COOLDOWN_SECONDS * 1000,
          ).toISOString(),
        },
        { status: 429 },
      );
    }
  }

  // 4. 接点履歴を集約(=トークン超過を避けるため件数 + 長さを制限)
  let interactions: CustomerInteraction[] = [];
  if (sb && UUID_RE.test(id)) {
    const { data: rows } = await sb
      .from("customer_interactions")
      .select("*")
      .eq("customer_id", id)
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(MAX_INTERACTIONS_FOR_AI);
    interactions = (rows ?? []).map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      type: r.type,
      content: (r.content ?? "").slice(0, MAX_CONTENT_LENGTH_PER_ITEM),
      category: r.category ?? undefined,
      createdAt: r.created_at,
    }));
  } else {
    interactions = mockInteractions
      .filter((i) => i.customerId === id)
      .slice(0, MAX_INTERACTIONS_FOR_AI)
      .map((i) => ({
        ...i,
        content: i.content.slice(0, MAX_CONTENT_LENGTH_PER_ITEM),
      }));
  }

  if (interactions.length === 0) {
    return NextResponse.json(
      {
        error:
          "接点履歴がないため AI 分析できません。コメントの取得後に再度お試しください。",
      },
      { status: 400 },
    );
  }

  // 4. Claude 呼び出し
  let analysis: CustomerAIAnalysis;
  if (!hasAnthropic()) {
    // フォールバック(=API未設定時)
    analysis = {
      customerId: id,
      generatedAt: new Date().toISOString(),
      interests: `過去 ${interactions.length} 件の接点から、商品問い合わせと営業時間確認が中心。継続的に投稿に反応しており関心が高い。`,
      cautions:
        "クレーム履歴は確認されていないが、丁寧で正確な情報提供を心がける。返信遅延は満足度低下に直結する可能性あり。",
      summary: `@${customer.instagram_handle} は接点頻度の高い既存顧客層。FAQ 自動応答 + 担当者の個別フォローを組み合わせるのが効果的。`,
    };
  } else {
    const historyText = interactions
      .map(
        (it, idx) =>
          `${idx + 1}. [${new Date(it.createdAt).toISOString().slice(0, 10)}] (${it.type}) ${it.content}`,
      )
      .join("\n");

    const userPrompt = `顧客ハンドル: @${customer.instagram_handle}
接点履歴(直近 ${interactions.length} 件):
${historyText}

上記の履歴から、interests/cautions/summary の3要素をJSONで出力してください。`;

    try {
      const raw = await runClaude({
        system: SYSTEM_PROMPT,
        user: userPrompt,
        maxTokens: 800,
      });
      // Claude が ```json...``` で囲む / ``` だけで囲む / 何も囲まない いずれにも対応
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as {
        interests: string;
        cautions: string;
        summary: string;
      };
      analysis = {
        customerId: id,
        generatedAt: new Date().toISOString(),
        interests: parsed.interests,
        cautions: parsed.cautions,
        summary: parsed.summary,
      };
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? `AI分析に失敗:${err.message}`
              : "AI generation failed",
        },
        { status: 502 },
      );
    }
  }

  // 5. 永続化(=DB由来のレートリミット記録を兼ねる、サーバーレス環境でも有効)
  if (sb && UUID_RE.test(id)) {
    await sb
      .from("customers")
      .update({
        ai_analysis: analysis,
        ai_analysis_at: analysis.generatedAt,
      })
      .eq("id", id)
      .eq("user_id", auth.userId);
  }

  return NextResponse.json({ analysis, cached: false });
}
