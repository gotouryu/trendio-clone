import { NextResponse, type NextRequest } from "next/server";
import { hasGemini } from "@/lib/env";
import { GEMINI_MODEL, runGemini } from "@/lib/geminiClient";
import { mockPlanIdeas, mockGeneratedScript } from "@/lib/mockData";
import type {
  ScriptBrief,
  ScriptPlatform,
  PlanIdea,
  GeneratedScript,
  ScriptScene,
} from "@/lib/types";
import { requireUser } from "@/lib/supabase/requireUser";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/csrf";
import { consumeRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_FIELD = 500; // 1フィールド最大500文字(=トークン爆発防止)
const MIN_SCENE_SEC = 2;
const MONTHLY_AI_LIMIT = 20;

type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
};

function currentUsageMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function normalizeUsage(row: unknown, fallbackLimit = MONTHLY_AI_LIMIT): UsageInfo {
  const usage = asObject(row);
  const limit = Math.max(1, Number(usage.monthly_limit) || fallbackLimit);
  const used = Math.max(0, Number(usage.used ?? usage.count) || 0);
  return {
    used,
    limit,
    remaining: Math.max(0, Number(usage.remaining) || limit - used),
  };
}

async function getMonthlyUsage(userId: string): Promise<UsageInfo> {
  const sb = createSupabaseAdmin();
  const month = currentUsageMonth();
  const { data, error } = await sb
    .from("ai_content_monthly_usage")
    .select("count, monthly_limit")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw new Error("monthly_usage_lookup_failed");
  }
  return normalizeUsage(data ?? { count: 0, monthly_limit: MONTHLY_AI_LIMIT });
}

async function consumeMonthlyUsage(userId: string): Promise<
  | { allowed: true; usage: UsageInfo }
  | { allowed: false; usage: UsageInfo }
> {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb.rpc("consume_ai_content_monthly_quota", {
    p_user_id: userId,
    p_month: currentUsageMonth(),
    p_limit: MONTHLY_AI_LIMIT,
  });

  if (error) {
    throw new Error("monthly_usage_consume_failed");
  }

  const row = Array.isArray(data) ? data[0] : data;
  const normalized = normalizeUsage(row);
  return {
    allowed: !!asObject(row).allowed,
    usage: normalized,
  };
}

function quotaExceededResponse(usage: UsageInfo) {
  return NextResponse.json(
    {
      error: `今月のAI生成上限(${usage.limit}回)に達しました。来月まで生成できません。`,
      usage,
    },
    { status: 429 },
  );
}

async function logAiContentGeneration({
  userId,
  mode,
  status,
  counted,
  mock,
  errorCode,
}: {
  userId: string;
  mode: "plans" | "script";
  status: "success" | "blocked_quota" | "fallback" | "error";
  counted: boolean;
  mock: boolean;
  errorCode?: string;
}) {
  try {
    const sb = createSupabaseAdmin();
    await sb.from("ai_content_generation_logs").insert({
      user_id: userId,
      month: currentUsageMonth(),
      mode,
      model: GEMINI_MODEL,
      counted,
      mock,
      status,
      error_message: errorCode ?? null,
    });
  } catch {
    console.warn("[ai-content] generation log failed");
  }
}

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
    goal: toStr(b.goal),
    sellingPoints: toStr(b.sellingPoints),
    avoidExpressions: toStr(b.avoidExpressions),
    tone: toStr(b.tone),
    availableAssets: toStr(b.availableAssets),
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
  return `<brief>
<target>${b.target || "未指定"}</target>
<theme>${b.theme || "未指定"}</theme>
<goal>${b.goal || "未指定"}</goal>
<selling_points>${b.sellingPoints || "未指定。入力されていない根拠や強みは作らない"}</selling_points>
<avoid_expressions>${b.avoidExpressions || "未指定"}</avoid_expressions>
<tone>${b.tone || "未指定"}</tone>
<available_assets>${b.availableAssets || "未指定"}</available_assets>
<performer>${b.hasPerformer ? "あり。人物出演を使える" : "なし。商品・画面・資料・手元・テロップ中心で成立させる"}</performer>
<narration>${b.hasNarration ? "あり。ナレーションまたはセリフを使える" : "なし。テロップと映像だけで意味を通す"}</narration>
<must_include>${b.mustInclude || "特になし"}</must_include>
<duration>${b.durationSec}秒</duration>
<cta>${b.cta || "未指定"}</cta>
<company_name>${b.companyName || "未指定"}</company_name>
<company_url>${b.companyUrl || "なし"}</company_url>
<reference_url>${b.referenceUrl || "なし。URLの中身は解析しない"}</reference_url>
<platform>${b.platform}</platform>
</brief>`;
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

const PLAN_SCHEMA = {
  type: "array",
  minItems: 3,
  maxItems: 3,
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description: "短く覚えやすい企画タイトル。視聴者向けではなく選択肢名。",
      },
      concept: {
        type: "string",
        description: "ターゲットの関心とCTAをつなぐ企画意図。",
      },
      hook: {
        type: "string",
        description: "リール冒頭2秒でスクロールを止めるテロップまたは一言。",
      },
      outline: {
        type: "string",
        description: "動画の流れ。2から4行で冒頭、本編、CTAが分かる。",
      },
    },
    required: ["title", "concept", "hook", "outline"],
  },
} as const;

const SCRIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    planTitle: {
      type: "string",
      description: "選択された企画タイトル。",
    },
    totalDurationSec: {
      type: "integer",
      description: "台本全体の秒数。",
    },
    scenes: {
      type: "array",
      minItems: 3,
      maxItems: 12,
      description: "撮影と編集に使うシーン別台本。",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sceneNo: { type: "integer", description: "1始まりのシーン番号。" },
          durationSec: { type: "integer", description: "そのシーンの秒数。" },
          visual: {
            type: "string",
            description: "被写体、画角、動きが分かる具体的な映像指示。",
          },
          narration: {
            type: "string",
            description: "ナレーションまたはセリフ。ナレーションなし指定なら空文字。",
          },
          caption: {
            type: "string",
            description: "画面に出す短いテロップ。",
          },
          se: {
            type: "string",
            description: "効果音またはBGM指示。",
          },
        },
        required: [
          "sceneNo",
          "durationSec",
          "visual",
          "narration",
          "caption",
          "se",
        ],
      },
    },
    hashtags: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" },
      description: "#を除いたハッシュタグ候補。",
    },
    cta: {
      type: "string",
      description: "最終シーンで視聴者へ促す行動。",
    },
  },
  required: ["planTitle", "totalDurationSec", "scenes", "hashtags", "cta"],
} as const;

// ------------------------------------------------------------
// 段階①:企画案を3つ生成
// ------------------------------------------------------------
const SYSTEM_PLANS = `<role>
あなたは日本の中小企業が集客・認知・信頼形成に使うInstagramリールを設計するSNS動画プランナーです。
企画の価値は「ターゲットが止まる」「視聴後に会社の訴求が残る」「台本化して撮れる」「CTAに進む理由がある」の4点で判定します。
</role>

<task>
ユーザー入力だけを根拠に、動画尺に収まる企画候補を内部で比較し、採用価値が高い3案だけ返してください。
3案はターゲット心理、見せ方、訴求導線のいずれかを変え、ユーザーが比較して選べる差を作ってください。
</task>

<quality_bar>
- 1案目はターゲットの悩み、欲求、あるある、失敗回避のいずれかを起点にする
- 2案目はチェック、比較、意外性、検証、誤解解消のいずれかで続きを見たくさせる
- 3案目は信頼、根拠、利用シーン、選ばれる理由、裏側のいずれかで会社らしさを出す
- 各案で「誰のどんな気持ちを動かすか」「何を見せる動画か」「なぜCTAへ進むか」が読み取れる
- 冒頭のhookは投稿テーマの言い換えで終わらせず、視聴者が自分事化する一言にする
- 企画のoutlineは、冒頭フック、本編の価値、締めの行動が想像できる順にする
- テンプレ感の強い言葉だけで埋めず、入力テーマ・訴求ポイント・使える素材に固有の要素を使う
</quality_bar>

<output_fields>
- title: 企画タイトル(30文字以内)
- concept: 企画の狙い・コンセプト(80文字以内)
- hook: 冒頭2秒の掴み(視聴者がスワイプを止める一言、60文字以内)
- outline: 構成の概要(2〜3行、改行で区切る)
</output_fields>

<selection_rubric>
候補を内部比較する時は次の順で優先してください。
1. ターゲット適合: 入力された相手が止まり、最後まで見る理由がある
2. 訴求適合: 投稿目的と会社・商品・サービスの価値が自然につながる
3. 制作適合: 指定尺、演者、ナレーション、使える素材で撮影・編集できる
4. 差別化: 3案の見え方と選ぶ理由が重複しすぎない
</selection_rubric>

<constraints>
- ターゲット・投稿テーマ・絶対に入れたい内容・CTAを3案すべてに反映する
- 投稿目的、訴求ポイント、動画トーン、使える素材がある時は企画の方向と見せ方に反映する
- 避けたい表現がある時は言い換えまたは企画構造で回避する
- 入力が薄い場合も一般論だけの企画名で逃げず、与えられた情報の範囲で視聴者の状況と見せ方を具体化する
- 未入力の実績、数値、口コミ、制度、効果を事実のように捏造しない
- 商品名や会社名がある場合は自然に扱い、押し売りだけの広告企画にしない
- 動画の長さに収まる構成にする
- 演者なし指定なら人物出演を前提にしない。ナレーションなし指定ならテロップ主体にする
- 参考URLの中身を見た前提にしない。URLがある時も入力条件から企画を作る
</constraints>

<output_rule>
出力はJSON配列のみ。解説、採点、コードフェンス、思考過程は返さない。
</output_rule>`;

// ------------------------------------------------------------
// 段階②:選択企画 → シーン別台本
// ------------------------------------------------------------
const SYSTEM_SCRIPT = `<role>
あなたは日本のInstagramリールを、撮影・編集・投稿判断までできる台本へ落とす動画ディレクターです。
台本の価値は「冒頭で止まる」「映像が撮れる」「視聴者の納得が積み上がる」「テロップだけでも意味が通る」「CTAが自然」の5点で判定します。
</role>

<task>
選択済み企画を、指定尺ぴったりのシーン別台本にしてください。
撮影担当が追加説明なしで絵を想像でき、編集担当がテロップと音の役割を判断できる具体性を優先してください。
</task>

<output_fields>
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
</output_fields>

<quality_bar>
- シーン1は結論、疑問、違和感、失敗回避のいずれかで視聴者を止める
- シーン1のcaptionは投稿テーマの説明だけで始めず、ターゲットが自分に関係あると判断できる言葉にする
- 本編は「問題または欲求の提示」→「価値・根拠・使い方の提示」→「行動」の流れを基本にする
- 本編は同じ画の繰り返しを避け、チェック、比較、手元、商品、画面、利用シーン、人物リアクションなど画変わりを作る
- captionはスマホで一瞬で読める短さにする
- narrationとcaptionは同じ文の丸写しにせず、音声と画面文字の役割を分ける
- CTA直前に、CTAへ進む理由になる価値や納得を置く
</quality_bar>

<scene_design>
- visual は「被写体」「動き」「画角または見せ方」が分かるようにする
- caption は1シーンで伝える要点を1つに絞る
- se は場面転換、強調、余韻のどれに使うか分かる短い指示にする
- 入力された使える素材がある場合は、撮れない素材を増やす前にそれを優先して構成する
</scene_design>

<constraints>
- 1シーンは2〜8秒を目安にし、全シーンの durationSec の合計を指定の動画の長さ(秒)に一致させる
- 冒頭2秒で何が得られる動画か分かる構成にする
- 絶対に入れたい内容を必ずどこかのシーンに含める
- 投稿目的、訴求ポイント、動画トーン、使える素材がある時は映像指示とCTA導線に反映する
- 避けたい表現がある時はcaptionとnarrationでも避ける
- 演者あり/なし・ナレーションあり/なしの指定を厳守する
- ナレーションなし指定なら narration は必ず空文字 "" にし、caption だけで意味が通るようにする
- visual は「何を撮るか」が分かる具体表現にする。抽象語だけにしない
- 入力されていない数値、実績、効能、口コミを事実として作らない
- 最後のシーンに必ずCTAを入れる
</constraints>

<output_rule>
出力はJSONオブジェクトのみ。前置き、解説、採点、思考過程、コードフェンスは返さない。
</output_rule>`;

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    const usage = await getMonthlyUsage(auth.userId);
    return NextResponse.json({ usage });
  } catch (err) {
    console.error("[ai-content] usage lookup failed:", err);
    return NextResponse.json(
      { error: "AI生成の利用回数を確認できませんでした" },
      { status: 500 },
    );
  }
}

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

  if (body.mode !== undefined && body.mode !== "plans" && body.mode !== "script") {
    return NextResponse.json({ error: "mode must be plans or script" }, { status: 400 });
  }

  const mode = body.mode === "script" ? "script" : "plans";
  const brief = sanitizeBrief(body.brief);

  if (!brief.theme || !brief.target) {
    return NextResponse.json(
      { error: "ターゲットと投稿テーマは必須です" },
      { status: 400 },
    );
  }

  // ---------- 段階①:企画案生成 ----------
  if (mode === "plans") {
    if (!hasGemini()) {
      const usage = await getMonthlyUsage(auth.userId);
      return NextResponse.json({
        plans: mockPlanIdeas.map((p) => ({ ...p, id: `mock-${Date.now()}-${p.id}` })),
        mock: true,
        usage,
      });
    }
    const usageBefore = await getMonthlyUsage(auth.userId);
    if (usageBefore.remaining <= 0) {
      await logAiContentGeneration({
        userId: auth.userId,
        mode: "plans",
        status: "blocked_quota",
        counted: false,
        mock: false,
        errorCode: "monthly_quota_exceeded",
      });
      return quotaExceededResponse(usageBefore);
    }
    const userPrompt = `<user_context>
${briefBlock(brief)}
</user_context>

<request>
上記条件に適合する企画案を内部で比較し、ターゲット適合度、訴求の明確さ、企画の差、撮影可能性、CTA接続が高い3案だけ返してください。
入力条件が多い場合は情報を詰め込みすぎず、各案で視聴者に残す主メッセージを1つに絞ってください。
</request>`;
    try {
      const raw = await runGemini({
        system: SYSTEM_PLANS,
        user: userPrompt,
        maxTokens: 2048,
        json: true,
        responseJsonSchema: PLAN_SCHEMA,
      });
      const plans = normalizePlans(JSON.parse(stripFence(raw)));
      if (plans.length < 2) {
        throw new Error("Gemini returned too few valid plans");
      }
      const quota = await consumeMonthlyUsage(auth.userId);
      if (!quota.allowed) {
        await logAiContentGeneration({
          userId: auth.userId,
          mode: "plans",
          status: "blocked_quota",
          counted: false,
          mock: false,
          errorCode: "monthly_quota_exceeded",
        });
        return quotaExceededResponse(quota.usage);
      }
      await logAiContentGeneration({
        userId: auth.userId,
        mode: "plans",
        status: "success",
        counted: true,
        mock: false,
      });
      return NextResponse.json({ plans, mock: false, usage: quota.usage });
    } catch {
      await logAiContentGeneration({
        userId: auth.userId,
        mode: "plans",
        status: "fallback",
        counted: false,
        mock: true,
        errorCode: "gemini_response_parse_failed",
      });
      const usage = await getMonthlyUsage(auth.userId);
      return NextResponse.json({
        plans: mockPlanIdeas.map((p) => ({ ...p, id: `fallback-${Date.now()}-${p.id}` })),
        mock: true,
        usage,
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
    const usage = await getMonthlyUsage(auth.userId);
    return NextResponse.json({
      script: { ...mockGeneratedScript, id: `mock-${Date.now()}`, planTitle: plan.title },
      mock: true,
      usage,
    });
  }

  const usageBefore = await getMonthlyUsage(auth.userId);
  if (usageBefore.remaining <= 0) {
    await logAiContentGeneration({
      userId: auth.userId,
      mode: "script",
      status: "blocked_quota",
      counted: false,
      mock: false,
      errorCode: "monthly_quota_exceeded",
    });
    return quotaExceededResponse(usageBefore);
  }

  const userPrompt = `<selected_plan>
<title>${plan.title}</title>
<concept>${plan.concept}</concept>
<hook>${plan.hook}</hook>
<outline>${plan.outline}</outline>
</selected_plan>

<user_context>
${briefBlock(brief)}
</user_context>

<request>
選択企画を${brief.durationSec}秒のシーン別台本にしてください。
条件が不足していても入力されていない事実は捏造せず、撮影指示とテロップの工夫で成立させてください。
投稿目的とCTAが自然につながるように、CTA直前までに視聴者が行動する理由を作ってください。
</request>`;
  try {
    const raw = await runGemini({
      system: SYSTEM_SCRIPT,
      user: userPrompt,
      maxTokens: 4096,
      json: true,
      responseJsonSchema: SCRIPT_SCHEMA,
    });
    const script = normalizeScript(JSON.parse(stripFence(raw)), plan, brief);
    if (!script) {
      throw new Error("Gemini returned no valid scenes");
    }
    const quota = await consumeMonthlyUsage(auth.userId);
    if (!quota.allowed) {
      await logAiContentGeneration({
        userId: auth.userId,
        mode: "script",
        status: "blocked_quota",
        counted: false,
        mock: false,
        errorCode: "monthly_quota_exceeded",
      });
      return quotaExceededResponse(quota.usage);
    }
    await logAiContentGeneration({
      userId: auth.userId,
      mode: "script",
      status: "success",
      counted: true,
      mock: false,
    });
    return NextResponse.json({ script, mock: false, usage: quota.usage });
  } catch {
    await logAiContentGeneration({
      userId: auth.userId,
      mode: "script",
      status: "fallback",
      counted: false,
      mock: true,
      errorCode: "gemini_response_parse_failed",
    });
    const usage = await getMonthlyUsage(auth.userId);
    return NextResponse.json({
      script: { ...mockGeneratedScript, id: `fallback-${Date.now()}`, planTitle: plan.title },
      mock: true,
      usage,
      warning: "Gemini応答の解析に失敗したため、デモ用Mockを表示しています",
    });
  }
}
