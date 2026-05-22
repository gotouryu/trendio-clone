import { NextResponse, type NextRequest } from "next/server";
import { hasGemini } from "@/lib/env";
import { runGemini } from "@/lib/geminiClient";
import { mockPlanIdeas, mockGeneratedScript } from "@/lib/mockData";
import type {
  ScriptBrief,
  ScriptPlatform,
  PlanIdea,
  GeneratedScript,
  ScriptScene,
} from "@/lib/types";
import { requireUser } from "@/lib/supabase/requireUser";
import { assertSameOrigin } from "@/lib/csrf";
import { consumeRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_FIELD = 500; // 1フィールド最大500文字(=トークン爆発防止)
const MIN_SCENE_SEC = 2;

// ------------------------------------------------------------
// 入力サニタイズ
// ------------------------------------------------------------
function toStr(v: unknown): string {
  return String(v ?? "").slice(0, MAX_FIELD);
}

function sanitizeBrief(raw: unknown): ScriptBrief {
  const b = (raw ?? {}) as Record<string, unknown>;
  const platform: ScriptPlatform =
    b.platform === "instagram" || b.platform === "tiktok" ? b.platform : "all";
  return {
    target: toStr(b.target),
    theme: toStr(b.theme),
    hasPerformer: !!b.hasPerformer,
    hasNarration: !!b.hasNarration,
    mustInclude: toStr(b.mustInclude),
    durationSec: Math.max(5, Math.min(180, Number(b.durationSec) || 30)),
    referenceUrl: toStr(b.referenceUrl),
    cta: toStr(b.cta),
    companyName: toStr(b.companyName),
    companyUrl: toStr(b.companyUrl),
    platform,
  };
}

// お客様が入力した10項目を、両プロンプトに同一フォーマットで注入する
function briefBlock(b: ScriptBrief): string {
  return `ターゲット: ${b.target || "未指定"}
投稿テーマ: ${b.theme || "未指定"}
演者: ${b.hasPerformer ? "あり(人物が出演)" : "なし(商品・資料・テロップ中心)"}
ナレーション: ${b.hasNarration ? "あり(語り/セリフを入れる)" : "なし(テロップとBGMで進行)"}
絶対に入れたい内容: ${b.mustInclude || "特になし"}
動画の長さ: ${b.durationSec}秒
CTA(視聴後にしてほしい行動): ${b.cta || "未指定"}
会社名: ${b.companyName || "未指定"}
会社URL: ${b.companyUrl || "なし"}
参考URL: ${b.referenceUrl || "なし"}
プラットフォーム: ${b.platform}`;
}

function stripFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function compactText(v: unknown, max = 300): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function lineText(v: unknown, max = 500): string {
  return String(v ?? "").trim().slice(0, max);
}

function normalizePlans(raw: unknown): PlanIdea[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      const p = asObject(item);
      return {
        id: `plan-${Date.now()}-${i}`,
        title: compactText(p.title, 40),
        concept: compactText(p.concept, 120),
        hook: compactText(p.hook, 90),
        outline: lineText(p.outline, 500),
      };
    })
    .filter((p) => p.title && p.concept && p.hook && p.outline)
    .slice(0, 5);
}

function distributeDurations(count: number, totalSec: number): number[] {
  const safeCount = Math.max(1, count);
  const base = Math.max(MIN_SCENE_SEC, Math.floor(totalSec / safeCount));
  const durations = Array.from({ length: safeCount }, () => base);
  let diff = totalSec - durations.reduce((sum, n) => sum + n, 0);
  let i = 0;
  while (diff !== 0 && i < 200) {
    const idx = i % safeCount;
    if (diff > 0) {
      durations[idx] += 1;
      diff -= 1;
    } else if (durations[idx] > MIN_SCENE_SEC) {
      durations[idx] -= 1;
      diff += 1;
    }
    i += 1;
  }
  return durations;
}

function normalizeScript(raw: unknown, plan: PlanIdea, brief: ScriptBrief): GeneratedScript | null {
  const parsed = asObject(raw);
  const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  const scenes: ScriptScene[] = rawScenes
    .map((item, i) => {
      const s = asObject(item);
      return {
        sceneNo: Number(s.sceneNo) || i + 1,
        durationSec: Math.max(0, Math.round(Number(s.durationSec) || 0)),
        visual: lineText(s.visual, 500),
        narration: brief.hasNarration ? lineText(s.narration, 500) : "",
        caption: lineText(s.caption, 220),
        se: lineText(s.se, 160),
      };
    })
    .filter((s) => s.visual && s.caption);

  if (scenes.length === 0) return null;

  const totalDurationSec = Math.max(5, Math.min(180, Number(parsed.totalDurationSec) || brief.durationSec));
  const currentTotal = scenes.reduce((sum, s) => sum + s.durationSec, 0);
  if (currentTotal !== brief.durationSec) {
    const durations = distributeDurations(scenes.length, brief.durationSec);
    scenes.forEach((s, i) => {
      s.durationSec = durations[i];
    });
  }

  const rawHashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  const hashtags = rawHashtags
    .map((h) => compactText(h, 30).replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 6);

  return {
    id: `script-${Date.now()}`,
    planTitle: compactText(parsed.planTitle, 60) || plan.title,
    totalDurationSec: brief.durationSec || totalDurationSec,
    scenes,
    hashtags: hashtags.length ? hashtags : ["リール動画", "SNS運用", "動画台本"],
    cta: compactText(parsed.cta, 120) || brief.cta || "詳しくはプロフィールから",
  };
}

// ------------------------------------------------------------
// 段階①:企画案を3つ生成
// ------------------------------------------------------------
const SYSTEM_PLANS = `あなたはSNS縦型動画(Instagramリール)専門の構成作家です。視聴維持率と問い合わせ・保存・購入などのCTA達成率を最大化する企画を考えます。

ユーザーから動画の条件を受け取り、性質の異なる企画案を3つ提案してください。各案は以下のフィールドを持つJSONオブジェクトです:
- title: 企画タイトル(30文字以内)
- concept: 企画の狙い・コンセプト(80文字以内)
- hook: 冒頭2秒の掴み(視聴者がスワイプを止める一言、60文字以内)
- outline: 構成の概要(2〜3行、改行で区切る)

必ず守ること:
- 3案は「課題共感型」「意外性・検証型」「信頼・実績型」のように切り口を明確に変える
- ターゲット・投稿テーマ・絶対に入れたい内容・CTAを3案すべてに反映する
- 商品名や会社名がある場合は自然に入れ、広告っぽい押し売りだけの企画にしない
- 動画の長さに収まる構成にする
- 演者なし指定なら人物出演を前提にしない。ナレーションなし指定ならテロップ主体にする
- 参考URLは雰囲気・構成の参考として扱い、動画解析できる前提で書かない

出力は厳密に次のJSON配列のみ。前置き・解説・コードフェンスは一切禁止:
[{"title":"...","concept":"...","hook":"...","outline":"..."},{...},{...}]`;

// ------------------------------------------------------------
// 段階②:選択企画 → シーン別台本
// ------------------------------------------------------------
const SYSTEM_SCRIPT = `あなたはSNS縦型動画専門の構成作家です。採用された企画案を、撮影・編集できる粒度のシーン別台本に分解します。

出力する台本は以下のJSONオブジェクトです:
- planTitle: 企画タイトル
- totalDurationSec: 合計尺(秒、指定の動画の長さに一致させる)
- scenes: シーン配列。各シーンは {sceneNo, durationSec, visual, narration, caption, se}
  - sceneNo: 1始まりの通し番号
  - durationSec: そのシーンの秒数(全シーン合計が totalDurationSec に一致)
  - visual: 映像(何を撮るか/何を映すか、具体的に)
  - narration: ナレーション/セリフ(ナレーションなし指定なら空文字 "")
  - caption: テロップ(画面に表示する文字)
  - se: SE(効果音やBGMの指示)
- hashtags: ハッシュタグ配列(3〜6個、#は含めない)
- cta: 最終シーンの行動喚起(指定のCTAを使う)

必ず守ること:
- 1シーンは2〜8秒を目安にし、全シーンの durationSec の合計を指定の動画の長さ(秒)に一致させる
- 冒頭2秒で何が得られる動画か分かる構成にする
- 絶対に入れたい内容を必ずどこかのシーンに含める
- 演者あり/なし・ナレーションあり/なしの指定を厳守する
- ナレーションなし指定なら narration は必ず空文字 "" にし、caption だけで意味が通るようにする
- visual は「何を撮るか」が分かる具体表現にする。抽象語だけにしない
- 最後のシーンに必ずCTAを入れる

出力は厳密に上記JSONオブジェクトのみ。前置き・解説・コードフェンスは一切禁止。`;

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------
export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // AIコンテンツ生成のレートリミット(=2段階フローで複数回呼ぶため緩め)
  const rl = await consumeRateLimit({
    userId: auth.userId,
    kind: "ai_content",
    windowSec: 60,
    maxInWindow: 8,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `AI生成は1分に8回までです。あと ${rl.retryAfterSec} 秒お待ちください。`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: { mode?: string; brief?: unknown; plan?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const mode = body.mode === "script" ? "script" : "plans";
  const brief = sanitizeBrief(body.brief);

  if (!brief.theme && !brief.target) {
    return NextResponse.json(
      { error: "投稿テーマかターゲットのどちらかは必須です" },
      { status: 400 },
    );
  }

  // ---------- 段階①:企画案生成 ----------
  if (mode === "plans") {
    if (!hasGemini()) {
      return NextResponse.json({
        plans: mockPlanIdeas.map((p) => ({ ...p, id: `mock-${Date.now()}-${p.id}` })),
        mock: true,
      });
    }
    const userPrompt = `# 動画の条件
${briefBlock(brief)}

上記すべての条件を踏まえ、性質の異なる企画案を3つ生成してください。`;
    try {
      const raw = await runGemini({
        system: SYSTEM_PLANS,
        user: userPrompt,
        maxTokens: 2048,
        json: true,
      });
      const plans = normalizePlans(JSON.parse(stripFence(raw)));
      if (plans.length < 2) {
        throw new Error("Gemini returned too few valid plans");
      }
      return NextResponse.json({ plans, mock: false });
    } catch {
      return NextResponse.json({
        plans: mockPlanIdeas.map((p) => ({ ...p, id: `fallback-${Date.now()}-${p.id}` })),
        mock: true,
        warning: "Gemini応答の解析に失敗したため、デモ用Mockを表示しています",
      });
    }
  }

  // ---------- 段階②:シーン別台本生成 ----------
  const planRaw = (body.plan ?? {}) as Record<string, unknown>;
  const plan: PlanIdea = {
    id: toStr(planRaw.id),
    title: toStr(planRaw.title),
    concept: toStr(planRaw.concept),
    hook: toStr(planRaw.hook),
    outline: toStr(planRaw.outline),
  };
  if (!plan.title) {
    return NextResponse.json({ error: "採用する企画案がありません" }, { status: 400 });
  }

  if (!hasGemini()) {
    return NextResponse.json({
      script: { ...mockGeneratedScript, id: `mock-${Date.now()}`, planTitle: plan.title },
      mock: true,
    });
  }

  const userPrompt = `# 採用する企画案
タイトル: ${plan.title}
コンセプト: ${plan.concept}
フック: ${plan.hook}
構成概要: ${plan.outline}

# 動画の条件(再掲)
${briefBlock(brief)}

上記の企画案を、${brief.durationSec}秒のシーン別台本に分解してください。`;
  try {
    const raw = await runGemini({
      system: SYSTEM_SCRIPT,
      user: userPrompt,
      maxTokens: 4096,
      json: true,
    });
    const script = normalizeScript(JSON.parse(stripFence(raw)), plan, brief);
    if (!script) {
      throw new Error("Gemini returned no valid scenes");
    }
    return NextResponse.json({ script, mock: false });
  } catch {
    return NextResponse.json({
      script: { ...mockGeneratedScript, id: `fallback-${Date.now()}`, planTitle: plan.title },
      mock: true,
      warning: "Gemini応答の解析に失敗したため、デモ用Mockを表示しています",
    });
  }
}
