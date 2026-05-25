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
    industry: toStr(b.industry),
    businessType: toStr(b.businessType),
    target: toStr(b.target),
    theme: toStr(b.theme),
    trendReference: toStr(b.trendReference),
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
<industry>${b.industry || "未指定"}</industry>
<business_type>${b.businessType || "未指定"}</business_type>
<target>${b.target || "未指定"}</target>
<theme>${b.theme || "未指定"}</theme>
<trend_reference>${b.trendReference || "未指定。リアルタイムの流行は取得していないため、入力された傾向や一般的な投稿型だけを使う"}</trend_reference>
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

const PLACEHOLDER_PATTERNS = [
  /〇〇/,
  /○○/,
  /◯◯/,
  /\bX{2,}\b/i,
  /〜〜/,
  /\[(?:商品名|サービス名|会社名|店名|メニュー名|地域名|地名|ターゲット|CTA|URL)[^\]]*\]/,
  /\{(?:商品名|サービス名|会社名|店名|メニュー名|地域名|地名|ターゲット|CTA|URL)[^}]*\}/,
  /未定/,
  /仮置き?/,
];

const ASSERTIVE_TERMS = [
  "絶対",
  "必ず",
  "誰でも",
  "確実",
  "保証",
  "No.1",
  "日本一",
  "業界初",
  "最安",
  "最高",
];

const REGION_TERMS = [
  "東京",
  "大阪",
  "渋谷",
  "新宿",
  "銀座",
  "横浜",
  "名古屋",
  "福岡",
  "札幌",
  "京都",
  "神戸",
];

const INDUSTRY_RISK_TERMS: Array<{ match: string[]; terms: string[] }> = [
  {
    match: ["エステ", "美容医療", "健康", "整体", "整骨", "鍼灸"],
    terms: ["治る", "完治", "即効", "改善率", "痛みが消える", "医師監修"],
  },
  {
    match: ["教育", "スクール"],
    terms: ["必ず合格", "確実に上達", "短期間で確実"],
  },
  {
    match: ["士業", "専門サービス"],
    terms: ["絶対解決", "必ず得する", "成果保証"],
  },
  {
    match: ["不動産", "住宅"],
    terms: ["利回り保証", "必ず売れる", "資産価値が上がる"],
  },
  {
    match: ["BtoB"],
    terms: ["完全自動化", "%削減", "導入社数"],
  },
];

function uniqueTerms(terms: string[]): string[] {
  return Array.from(new Set(terms.map((term) => term.trim()).filter((term) => term.length >= 2)));
}

function avoidExpressionTerms(brief: ScriptBrief): string[] {
  const base = brief.avoidExpressions
    .split(/[、,\n]/)
    .map((term) => term.trim())
    .filter(Boolean);
  const expanded = base.flatMap((term) => {
    const terms = [term];
    if (term.endsWith("営業")) terms.push(term.replace(/営業$/, ""));
    if (term.endsWith("表現")) terms.push(term.replace(/表現$/, ""));
    return terms;
  });
  return uniqueTerms(expanded);
}

function briefAllowedFactsText(brief: ScriptBrief): string {
  return [
    brief.industry,
    brief.businessType,
    brief.target,
    brief.theme,
    brief.trendReference,
    brief.goal,
    brief.sellingPoints,
    brief.tone,
    brief.availableAssets,
    brief.mustInclude,
    brief.referenceUrl,
    brief.cta,
    brief.companyName,
    brief.companyUrl,
    brief.platform,
  ].join("\n");
}

function assertNoQualityIssues(text: string, brief: ScriptBrief) {
  const source = briefAllowedFactsText(brief);
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) throw new Error("quality gate failed: placeholder");
  }
  for (const term of avoidExpressionTerms(brief)) {
    if (text.includes(term)) {
      throw new Error(`quality gate failed: avoid expression ${term}`);
    }
  }
  for (const term of ASSERTIVE_TERMS) {
    if (text.includes(term) && !source.includes(term)) {
      throw new Error(`quality gate failed: assertive term ${term}`);
    }
  }
  for (const term of REGION_TERMS) {
    if (text.includes(term) && !source.includes(term)) {
      throw new Error(`quality gate failed: unprovided region ${term}`);
    }
  }
  for (const rule of INDUSTRY_RISK_TERMS) {
    if (!rule.match.some((m) => brief.industry.includes(m))) continue;
    for (const term of rule.terms) {
      if (text.includes(term) && !source.includes(term)) {
        throw new Error(`quality gate failed: industry risk term ${term}`);
      }
    }
  }
}

function assertPlanQuality(plans: PlanIdea[], brief: ScriptBrief) {
  const text = JSON.stringify(plans);
  assertNoQualityIssues(text, brief);
  const joinedAngles = plans.map((p) => p.angle.toLowerCase()).join(" ");
  const required = ["trend", "buzz", "save", "trust", "original"];
  const ja = ["トレンド", "バズ", "保存", "信頼", "新規"];
  required.forEach((key, i) => {
    if (!joinedAngles.includes(key) && !plans.some((p) => p.angle.includes(ja[i]))) {
      throw new Error(`quality gate failed: missing angle ${key}`);
    }
  });
}

function assertScriptQuality(script: GeneratedScript, brief: ScriptBrief) {
  assertNoQualityIssues(JSON.stringify(script), brief);
}

function replaceAvoidExpressions(text: string, brief: ScriptBrief): string {
  return avoidExpressionTerms(brief).reduce((current, term) => {
    const replacement = term === "深夜" ? "夜" : "";
    return current.split(term).join(replacement);
  }, text);
}

function cleanGeneratedText(v: unknown, max: number, brief?: ScriptBrief): string {
  const cleaned = String(v ?? "")
    .replace(/一人[〇○◯]{2,}/g, "一人利用")
    .replace(/[〇○◯]{2,}/g, "内容")
    .replace(/\bX{2,}\b/gi, "内容")
    .replace(/〜〜/g, "")
    .replace(/\[(?:商品名|サービス名|会社名|店名|メニュー名|地域名|地名|ターゲット|CTA|URL)[^\]]*\]/g, "内容")
    .replace(/\{(?:商品名|サービス名|会社名|店名|メニュー名|地域名|地名|ターゲット|CTA|URL)[^}]*\}/g, "内容")
    .replace(/\s+/g, " ")
    .trim()
  const withoutAvoid = brief ? replaceAvoidExpressions(cleaned, brief) : cleaned;
  return withoutAvoid.replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanGeneratedLine(v: unknown, max: number, brief?: ScriptBrief): string {
  return cleanGeneratedText(v, max, brief).replace(/\\n/g, "\n");
}

function generationErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota")) {
    return "gemini_quota_exhausted";
  }
  if (message.includes("quality gate failed")) {
    return message.slice(0, 180);
  }
  if (message.includes("JSON")) {
    return "gemini_json_parse_failed";
  }
  return "gemini_generation_failed";
}

async function generatePlansOnce(userPrompt: string, brief: ScriptBrief): Promise<PlanIdea[]> {
  const raw = await runGemini({
    system: SYSTEM_PLANS,
    user: userPrompt,
    maxTokens: 3072,
    json: true,
    responseJsonSchema: PLAN_SCHEMA,
  });
  const plans = normalizePlans(JSON.parse(stripFence(raw)), brief);
  if (plans.length < 5) {
    throw new Error("Gemini returned too few valid plans");
  }
  assertPlanQuality(plans, brief);
  return plans;
}

async function generateScriptOnce(
  userPrompt: string,
  plan: PlanIdea,
  brief: ScriptBrief,
): Promise<GeneratedScript> {
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
  assertScriptQuality(script, brief);
  return script;
}

function normalizePlans(raw: unknown, brief: ScriptBrief): PlanIdea[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      const p = asObject(item);
      return {
        id: `plan-${Date.now()}-${i}`,
        angle: cleanGeneratedText(p.angle, 30, brief),
        title: cleanGeneratedText(p.title, 40, brief),
        concept: cleanGeneratedText(p.concept, 120, brief),
        hook: cleanGeneratedText(p.hook, 90, brief),
        outline: cleanGeneratedLine(p.outline, 500, brief),
        trendFit: cleanGeneratedText(p.trendFit, 120, brief),
        buzzReason: cleanGeneratedText(p.buzzReason, 120, brief),
        recommendedFor: cleanGeneratedText(p.recommendedFor, 120, brief),
      };
    })
    .filter((p) => p.angle && p.title && p.concept && p.hook && p.outline)
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
        visual: cleanGeneratedLine(s.visual, 500, brief),
        narration: brief.hasNarration ? cleanGeneratedLine(s.narration, 500, brief) : "",
        caption: cleanGeneratedLine(s.caption, 220, brief),
        se: cleanGeneratedLine(s.se, 160, brief),
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
    .map((h) => cleanGeneratedText(h, 30, brief).replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 6);

  return {
    id: `script-${Date.now()}`,
    planTitle: cleanGeneratedText(parsed.planTitle, 60, brief) || plan.title,
    totalDurationSec: brief.durationSec || totalDurationSec,
    scenes,
    hashtags: hashtags.length ? hashtags : ["リール動画", "SNS運用", "動画台本"],
    cta: cleanGeneratedText(parsed.cta, 120, brief) || brief.cta || "詳しくはプロフィールから",
  };
}

const PLAN_SCHEMA = {
  type: "array",
  minItems: 5,
  maxItems: 5,
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      angle: {
        type: "string",
        description: "企画タイプ。trend, buzz, save, trust, original のいずれかを日本語で分かる短い名前にする。",
      },
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
      trendFit: {
        type: "string",
        description: "参考にした投稿型、流行の型、または流行に寄せない理由。",
      },
      buzzReason: {
        type: "string",
        description: "コメント、保存、シェア、視聴維持のどれが起きやすいかと理由。",
      },
      recommendedFor: {
        type: "string",
        description: "この企画が向く投稿目的、商材状況、顧客心理。",
      },
    },
    required: [
      "angle",
      "title",
      "concept",
      "hook",
      "outline",
      "trendFit",
      "buzzReason",
      "recommendedFor",
    ],
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
// 段階①:企画案を5つ生成
// ------------------------------------------------------------
const SYSTEM_PLANS = `<role>
あなたは日本の中小企業がInstagramリールやショート動画で成果を出すためのSNS企画責任者です。
営業訴求だけに寄せず、「バズる可能性」「保存される価値」「信頼形成」「撮影しやすさ」「新しい切り口」のバランスで企画を判断します。
</role>

<task>
ユーザー入力だけを根拠に、動画尺に収まる企画候補を内部で比較し、使い分けできる5案だけ返してください。
5案は必ず次の5タイプに分け、似たタイトルや似た構成を並べないでください。
</task>

<required_angles>
1. trend: 入力された業種・業態・参考トレンドに合う投稿型へ寄せる案。参考トレンド未指定の場合は、チェックリスト、あるある、比較、裏側、失敗回避など一般的なショート動画の型から選ぶ。
2. buzz: コメント、共感、ツッコミ、意外性、続きが気になる構成で反応を狙う案。ただし炎上狙い、誇張、煽りすぎは禁止。
3. save: 後で見返したくなるチェックリスト、手順、比較表、選び方、注意点の案。
4. trust: 信頼、安心、専門性、選ばれる理由、裏側、利用前の不安解消を作る案。
5. original: 競合がやりがちな型から少し外した新しい切り口の案。奇抜さだけでなく、業種・業態と撮影可能性を守る。
</required_angles>

<industry_context>
業種・業態は最優先の文脈として扱う。同じターゲット・投稿目的でも、業種ごとに視聴者の悩み、信用の作り方、撮影素材、CTA導線、避けるべき表現を変える。
- 美容室・サロン: 似合わせ、仕上がり、再現性、相談しやすさ、予約導線を重視。効果断定や過度なBefore/Afterに寄せすぎない。
- エステ・美容医療・健康系: 不安解消、安心感、継続しやすさ、相談導線を重視。治る、痩せる保証、医学的断定、過度な効能表現、ビフォーアフターの効果保証は禁止。
- 整体・整骨・鍼灸: 悩み共感、生活習慣、来店ハードル低下、初回相談を重視。治る、完治、即効、改善率、痛みが消える、医師監修、医療効果の断定は禁止。
- 飲食: 食欲、利用シーン、限定感、写真映え、来店理由を重視。味、人気、行列、口コミ評価、地名、地域ハッシュタグを捏造しない。
- 士業・専門サービス: 分かりやすさ、不安解消、信頼、相談導線を重視。必ず得する、絶対解決、成果保証は禁止。
- 不動産・住宅: 暮らしの具体像、比較ポイント、失敗回避、内見・相談導線を重視。未入力の価格、利回り、施工実績は作らない。
- 教育・スクール: 成長過程、講師の安心感、続けやすさ、体験申込を重視。必ず合格、確実に上達などの保証は禁止。
- EC・物販: 使用シーン、選び方、比較、開封、悩み解決、購入導線を重視。実在しないレビュー、ランキング、受賞歴は作らない。
- BtoBサービス: 業務課題、時間削減、属人化解消、導入後の変化、資料請求を重視。未入力の削減率や導入実績は作らない。
</industry_context>

<hard_ng_rules>
- 伏せ字、穴埋め、仮置き表現は禁止: 〇〇、○○、◯◯、XX、XXX、〜〜、[商品名]、{サービス名}、未定、仮、など。
- 入力されていない地名、地域名、駅名、受賞歴、ランキング、口コミ、導入社数、削減率、満足度、実績年数、価格、人数、数量を作らない。
- 入力されていない地域ハッシュタグを作らない。例: 東京グルメ、大阪美容、渋谷ランチ等。
- 会社名、商品名、サービス名は入力された表記をそのまま使う。ひらがな、カタカナ、ローマ字、略称へ勝手に変換しない。
- 商品名やメニュー名が未入力の場合、伏せ字にせず「新メニュー」「温かい一品」「サービス内容」など入力済み情報だけで書く。
- 避けたい表現に含まれる語句は、引用、例示、強調、ハッシュタグでも使わない。
- 「絶対」「必ず」「誰でも」「確実」「保証」「No.1」「日本一」「業界初」「最安」「最高」など、根拠が必要な断定・最上級は入力に根拠がない限り使わない。
- 投稿テーマの範囲を勝手に広げない。例: 夜限定を深夜、相談を診断、効率化を完全自動化へ言い換えない。
- 参考トレンドは型だけを借りる。元投稿の事実、数字、人物、地名、ブランド、コメント数、再生数は作らない。
</hard_ng_rules>

<quality_bar>
- 各案で「なぜ見られるか」「なぜ反応されるか」「なぜ次の行動へ進むか」が読み取れる
- 冒頭hookは投稿テーマの言い換えで終わらせず、ターゲットが自分事化する一言にする
- outlineは、冒頭フック、本編の価値、締めの行動が想像できる順にする
- trendFitには、参考にした投稿型・流行型、または流行に寄せない判断理由を書く
- buzzReasonには、視聴維持、コメント、保存、シェアのどれを狙うかを明記する
- recommendedForには、どの目的や状況で選ぶべき案かを書く
- テンプレ感の強い言葉だけで埋めず、業種・業態・入力テーマ・訴求ポイント・使える素材に固有の要素を使う
</quality_bar>

<self_check_before_output>
JSONを返す直前に、内部で次を確認してください。違反があれば出力前に修正してください。
1. 5案が trend / buzz / save / trust / original に分かれている
2. 伏せ字・仮置き・穴埋め表現がない
3. 未入力の地名、数字、実績、口コミ、ランキング、効果を作っていない
4. 業種別の危険表現を避けている
5. 会社名・商品名・サービス名の表記を勝手に変えていない
6. 各案の title / hook / outline が互いに似すぎていない
7. 避けたい表現に含まれる語句を出していない
</self_check_before_output>

<output_fields>
- angle: 企画タイプ(trend / buzz / save / trust / original の意味が分かる短い日本語)
- title: 企画タイトル(30文字以内)
- concept: 企画の狙い・コンセプト(80文字以内)
- hook: 冒頭2秒の掴み(視聴者がスワイプを止める一言、60文字以内)
- outline: 構成の概要(2〜3行、改行で区切る)
- trendFit: 寄せた投稿型・流行型・参考トレンドの使い方(80文字以内)
- buzzReason: 反応、保存、視聴維持が起きる理由(80文字以内)
- recommendedFor: この企画を選ぶべき目的・状況(80文字以内)
</output_fields>

<selection_rubric>
候補を内部比較する時は次の順で優先してください。
1. ターゲット適合: 入力された相手が止まり、最後まで見る理由がある
2. 業種適合: 業種・業態の悩み、購買行動、撮影素材、表現リスクに合っている
3. 拡散/保存適合: 企画タイプごとに、反応・保存・信頼・新規性の狙いが明確
4. 制作適合: 指定尺、演者、ナレーション、使える素材で撮影・編集できる
5. 差別化: 5案の見え方と選ぶ理由が重複しすぎない
</selection_rubric>

<constraints>
- ターゲット・投稿テーマ・業種・業態・絶対に入れたい内容・CTAを5案すべてに反映する
- 投稿目的、訴求ポイント、動画トーン、使える素材がある時は企画の方向と見せ方に反映する
- 参考トレンドがある時は、その型を丸写しせず、業種・業態に合う形へ翻訳する
- 参考トレンドが未指定の場合、リアルタイムの流行を知っている前提で断言しない
- 避けたい表現がある時は言い換えまたは企画構造で回避する
- 入力が薄い場合も一般論だけの企画名で逃げず、与えられた情報の範囲で視聴者の状況と見せ方を具体化する
- 未入力の実績、数値、口コミ、制度、効果を事実のように捏造しない
- 商品名や会社名がある場合は自然に扱い、押し売りだけの広告企画にしない
- 伏せ字、仮置き、穴埋め表現を残さない
- 入力された固有名詞の表記を改変しない
- 避けたい表現に含まれる語句を引用や例示でも出さない
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
選択企画の angle / trendFit / buzzReason / recommendedFor を、冒頭フック、画変わり、CTA直前の納得づくりに反映してください。
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
- trend型なら参考投稿型を業種に合わせて翻訳し、buzz型ならコメントや共感の余地、save型なら保存価値、trust型なら不安解消、original型なら意外な切り口を台本内に必ず出す
</quality_bar>

<scene_design>
- visual は「被写体」「動き」「画角または見せ方」が分かるようにする
- caption は1シーンで伝える要点を1つに絞る
- se は場面転換、強調、余韻のどれに使うか分かる短い指示にする
- 入力された使える素材がある場合は、撮れない素材を増やす前にそれを優先して構成する
</scene_design>

<hard_ng_rules>
- 伏せ字、穴埋め、仮置き表現は禁止: 〇〇、○○、◯◯、XX、XXX、〜〜、[商品名]、{サービス名}、未定、仮、など。
- 入力されていない地名、地域名、駅名、受賞歴、ランキング、口コミ、導入社数、削減率、満足度、実績年数、価格、人数、数量を作らない。
- 入力されていない地域ハッシュタグを作らない。例: 東京グルメ、大阪美容、渋谷ランチ等。
- 会社名、商品名、サービス名は入力された表記をそのまま使う。ひらがな、カタカナ、ローマ字、略称へ勝手に変換しない。
- 商品名やメニュー名が未入力の場合、伏せ字にせず「新メニュー」「温かい一品」「サービス内容」など入力済み情報だけで書く。
- 避けたい表現に含まれる語句は、引用、例示、強調、ハッシュタグでも使わない。
- 「絶対」「必ず」「誰でも」「確実」「保証」「No.1」「日本一」「業界初」「最安」「最高」など、根拠が必要な断定・最上級は入力に根拠がない限り使わない。
- 投稿テーマの範囲を勝手に広げない。例: 夜限定を深夜、相談を診断、効率化を完全自動化へ言い換えない。
- 美容、健康、整体、整骨、鍼灸、教育、士業、金融、不動産では、効果保証、合格保証、収益保証、法的結果保証、医療効果の断定を避ける。
</hard_ng_rules>

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
- 伏せ字、仮置き、穴埋め表現を残さない
- 入力された固有名詞の表記を改変しない
- 避けたい表現に含まれる語句を引用や例示でも出さない
- 最後のシーンに必ずCTAを入れる
</constraints>

<self_check_before_output>
JSONを返す直前に、内部で次を確認してください。違反があれば出力前に修正してください。
1. 全シーンの合計秒数が指定尺に一致する
2. 伏せ字・仮置き・穴埋め表現がない
3. 未入力の地名、数字、実績、口コミ、ランキング、効果を作っていない
4. 業種別の危険表現を避けている
5. 会社名・商品名・サービス名の表記を勝手に変えていない
6. hashtags に未入力の地域名や根拠不明の人気表現がない
7. 避けたい表現に含まれる語句を出していない
</self_check_before_output>

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
  } catch {
    console.error("[ai-content] usage lookup failed");
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

  if (!brief.industry || !brief.businessType || !brief.theme || !brief.target) {
    return NextResponse.json(
      { error: "業種、業態、ターゲット、投稿テーマは必須です" },
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
    const userPrompt = `<user_context>
${briefBlock(brief)}
</user_context>

<request>
上記条件に適合する企画案を内部で比較し、trend / buzz / save / trust / original の5タイプを1案ずつ返してください。
入力条件が多い場合は情報を詰め込みすぎず、各案で視聴者に残す主メッセージを1つに絞ってください。
各案は、選んだ後に別々の台本へ展開できるように、見せ方、撮影素材、フック、CTAまで差を作ってください。
</request>`;
    try {
      const plans = await generatePlansOnce(userPrompt, brief);
      await logAiContentGeneration({
        userId: auth.userId,
        mode: "plans",
        status: "success",
        counted: true,
        mock: false,
      });
      return NextResponse.json({ plans, mock: false, usage: quota.usage });
    } catch (error) {
      const errorCode = generationErrorCode(error);
      console.warn("[ai-content] plans fallback", { errorCode });
      await logAiContentGeneration({
        userId: auth.userId,
        mode: "plans",
        status: "fallback",
        counted: true,
        mock: true,
        errorCode,
      });
      return NextResponse.json({
        plans: mockPlanIdeas.map((p) => ({ ...p, id: `fallback-${Date.now()}-${p.id}` })),
        mock: true,
        usage: quota.usage,
        warning: "Gemini応答の解析に失敗したため、デモ用Mockを表示しています",
      });
    }
  }

  // ---------- 段階②:シーン別台本生成 ----------
  const planRaw = (body.plan ?? {}) as Record<string, unknown>;
  const plan: PlanIdea = {
    id: toStr(planRaw.id),
    angle: toStr(planRaw.angle),
    title: toStr(planRaw.title),
    concept: toStr(planRaw.concept),
    hook: toStr(planRaw.hook),
    outline: toStr(planRaw.outline),
    trendFit: toStr(planRaw.trendFit),
    buzzReason: toStr(planRaw.buzzReason),
    recommendedFor: toStr(planRaw.recommendedFor),
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

  const userPrompt = `<selected_plan>
<angle>${plan.angle}</angle>
<title>${plan.title}</title>
<concept>${plan.concept}</concept>
<hook>${plan.hook}</hook>
<outline>${plan.outline}</outline>
<trend_fit>${plan.trendFit}</trend_fit>
<buzz_reason>${plan.buzzReason}</buzz_reason>
<recommended_for>${plan.recommendedFor}</recommended_for>
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
    const script = await generateScriptOnce(userPrompt, plan, brief);
    await logAiContentGeneration({
      userId: auth.userId,
      mode: "script",
      status: "success",
      counted: true,
      mock: false,
    });
    return NextResponse.json({ script, mock: false, usage: quota.usage });
  } catch (error) {
    const errorCode = generationErrorCode(error);
    console.warn("[ai-content] script fallback", { errorCode });
    await logAiContentGeneration({
      userId: auth.userId,
      mode: "script",
      status: "fallback",
      counted: true,
      mock: true,
      errorCode,
    });
    return NextResponse.json({
      script: { ...mockGeneratedScript, id: `fallback-${Date.now()}`, planTitle: plan.title },
      mock: true,
      usage: quota.usage,
      warning: "Gemini応答の解析に失敗したため、デモ用Mockを表示しています",
    });
  }
}
