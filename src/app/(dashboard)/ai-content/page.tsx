"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Save,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  ArrowLeft,
  Film,
  Clock,
} from "lucide-react";
import type { ScriptBrief, PlanIdea, GeneratedScript } from "@/lib/types";
import { useToast } from "@/components/providers/ToasterProvider";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Tooltip } from "@/components/ui/Tooltip";

type Step = "input" | "plans" | "script";
type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const INDUSTRY_OPTIONS = [
  "美容室・サロン",
  "エステ・美容医療・健康系",
  "整体・整骨・鍼灸",
  "飲食",
  "士業・専門サービス",
  "不動産・住宅",
  "教育・スクール",
  "EC・物販",
  "BtoBサービス",
  "その他",
];
const BUSINESS_TYPE_OPTIONS = [
  "店舗型",
  "予約制",
  "訪問型",
  "オンライン型",
  "EC・通販",
  "サブスク",
  "法人向け",
  "個人向け",
];
const GOAL_OPTIONS = [
  "認知を広げる",
  "保存してもらう",
  "問い合わせを増やす",
  "購入につなげる",
  "来店につなげる",
  "採用応募につなげる",
];
const TONE_OPTIONS = [
  "親しみやすい",
  "信頼感",
  "驚き・意外性",
  "上質",
  "専門家風",
  "テンポ重視",
];

const emptyBrief: ScriptBrief = {
  industry: "",
  businessType: "",
  target: "",
  theme: "",
  trendReference: "",
  goal: "",
  sellingPoints: "",
  avoidExpressions: "",
  tone: "",
  availableAssets: "",
  hasPerformer: true,
  hasNarration: true,
  mustInclude: "",
  durationSec: 30,
  referenceUrl: "",
  cta: "",
  companyName: "",
  companyUrl: "",
  platform: "instagram",
};

type ISpeechRecognitionResult = ArrayLike<{ transcript: string }> & {
  isFinal: boolean;
};
type ISpeechRecognitionEvent = { results: ArrayLike<ISpeechRecognitionResult> };
type ISpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => ISpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export default function AIContentPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"new" | "saved">("new");
  const [step, setStep] = useState<Step>("input");

  const [brief, setBrief] = useState<ScriptBrief>(emptyBrief);
  const [plans, setPlans] = useState<PlanIdea[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanIdea | null>(null);
  const [script, setScript] = useState<GeneratedScript | null>(null);

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  const [saved, setSaved] = useLocalStorage<GeneratedScript[]>(
    "karteia-saved-scripts",
    [],
  );
  const [copied, setCopied] = useState(false);

  const [listening, setListening] = useState(false);
  const recRef = useRef<ISpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSpeechSupported(!!getSpeechRecognition());
    }, 0);
    return () => {
      window.clearTimeout(id);
      recRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/ai-content", { method: "GET" });
          const data = (await res.json()) as {
            usage?: UsageInfo;
            error?: string;
          };
          if (cancelled) return;
          if (!res.ok || !data.usage) {
            throw new Error(data.error ?? "利用回数を確認できませんでした");
          }
          setUsage(data.usage);
          setUsageError(null);
        } catch (e) {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : "利用回数を確認できませんでした";
          setUsageError(msg);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  function set<K extends keyof ScriptBrief>(key: K, value: ScriptBrief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  async function generatePlans() {
    if (!brief.theme || !brief.target) {
      toast("ターゲットと投稿テーマを入力してください", "error");
      return;
    }
    setLoadingPlans(true);
    setError(null);
    toast("AI が企画案を考えています...", "info");
    try {
      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "plans", brief }),
      });
      const data = (await res.json()) as {
        plans: PlanIdea[];
        mock?: boolean;
        warning?: string;
        error?: string;
        usage?: UsageInfo;
      };
      if (data.usage) setUsage(data.usage);
      if (!res.ok) throw new Error(data.error ?? "企画案の生成に失敗しました");
      setPlans(data.plans);
      setUsingMock(!!data.mock);
      setStep("plans");
      toast(`企画案を ${data.plans.length} 件生成しました`, "success");
      if (data.mock) toast("Mock表示中(Gemini APIキー未設定。本番では実生成)", "info");
      if (data.warning) toast(data.warning, "info");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "予期しないエラー";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoadingPlans(false);
    }
  }

  const missingRequired =
    !brief.industry.trim() ||
    !brief.businessType.trim() ||
    !brief.target.trim() ||
    !brief.theme.trim();
  const quotaUnavailable = !usage || !!usageError;
  const quotaExceeded = !!usage && usage.remaining <= 0;
  const generationDisabled = quotaUnavailable || quotaExceeded;

  async function generateScript(plan: PlanIdea) {
    setSelectedPlan(plan);
    setLoadingScript(true);
    setError(null);
    toast("AI が台本を組み立てています...", "info");
    try {
      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "script", brief, plan }),
      });
      const data = (await res.json()) as {
        script: GeneratedScript;
        mock?: boolean;
        warning?: string;
        error?: string;
        usage?: UsageInfo;
      };
      if (data.usage) setUsage(data.usage);
      if (!res.ok) throw new Error(data.error ?? "台本の生成に失敗しました");
      setScript(data.script);
      setUsingMock(!!data.mock);
      setStep("script");
      toast("台本を生成しました", "success");
      if (data.warning) toast(data.warning, "info");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "予期しないエラー";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoadingScript(false);
    }
  }

  function saveScript() {
    if (!script) return;
    if (saved.find((s) => s.id === script.id)) {
      toast("すでに保存済みです", "info");
      return;
    }
    setSaved((prev) => [
      { ...script, savedAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    toast("台本を保存しました", "success");
  }

  function deleteScript(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast("削除しました", "info");
  }

  async function copyScript(s: GeneratedScript) {
    const text =
      `【${s.planTitle}】(合計 ${s.totalDurationSec}秒)\n\n` +
      s.scenes
        .map(
          (sc) =>
            `■シーン${sc.sceneNo}(${sc.durationSec}秒)\n` +
            `映像: ${sc.visual}\n` +
            `ナレーション: ${sc.narration || "なし"}\n` +
            `テロップ: ${sc.caption}\n` +
            `SE: ${sc.se}`,
        )
        .join("\n\n") +
      `\n\nCTA: ${s.cta}\n` +
      `ハッシュタグ: ${s.hashtags.map((h) => `#${h}`).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!copied) {
        toast("コピーできませんでした。ブラウザの権限を確認してください", "error");
        return;
      }
    }
    setCopied(true);
    toast("台本をコピーしました", "success");
    setTimeout(() => setCopied(false), 1500);
  }

  function resetFlow() {
    setStep("input");
    setPlans([]);
    setSelectedPlan(null);
    setScript(null);
    setError(null);
  }

  // 音声入力(=絶対に入れたい内容 欄に追記)
  function startListening() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast("音声入力はChromeで利用できます", "info");
      return;
    }
    const rec = new Ctor();
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const results = e.results;
      let final = "";
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.isFinal) final += r[0].transcript;
      }
      if (final)
        setBrief((prev) => ({
          ...prev,
          mustInclude: prev.mustInclude ? prev.mustInclude + " " + final : final,
        }));
    };
    rec.onend = () => {
      setListening(false);
      toast("音声入力が完了しました", "success");
    };
    rec.onerror = () => {
      setListening(false);
      toast("音声入力でエラーが発生しました", "error");
    };
    rec.start();
    recRef.current = rec;
    setListening(true);
    toast("録音中...話してください", "info");
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          AI動画台本ジェネレーター
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          条件を入力 → 企画案を選ぶ → シーン別台本を自動生成
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          <TabBtn active={tab === "new"} onClick={() => setTab("new")}>
            新規作成
          </TabBtn>
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")}>
            保存した台本 ({saved.length})
          </TabBtn>
        </div>
      </div>

      {tab === "new" && (
        <>
          {/* ステップ進捗表示 */}
          <StepBar step={step} />

          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              quotaExceeded || usageError
                ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200"
                : "border-emerald-100 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            {usage ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  今月のAI生成: {usage.used}/{usage.limit}回
                </span>
                <span>
                  {quotaExceeded
                    ? "上限に達したため、来月まで生成できません。"
                    : `残り ${usage.remaining} 回生成できます。`}
                </span>
              </div>
            ) : (
              <span>
                {usageError
                  ? `利用回数を確認できません: ${usageError}`
                  : "今月のAI生成回数を確認しています..."}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {usingMock && (step === "plans" || step === "script") && (
            <div className="mb-4 inline-block text-xs px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              Mock(Gemini APIキー未設定。本番では実AI生成)
            </div>
          )}

          {/* ========== 段階0:入力フォーム ========== */}
          {step === "input" && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 space-y-5">
              <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                必須項目は業種、業態、ターゲット、投稿テーマです。未入力では企画案を生成できません。
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="業種" hint="企画の勝ち筋と表現リスクを調整します" required>
                  <select
                    value={brief.industry}
                    onChange={(e) => set("industry", e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">選択してください</option>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="業態" hint="店舗型、オンライン、法人向けなど" required>
                  <select
                    value={brief.businessType}
                    onChange={(e) => set("businessType", e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">選択してください</option>
                    {BUSINESS_TYPE_OPTIONS.map((businessType) => (
                      <option key={businessType} value={businessType}>
                        {businessType}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="ターゲット"
                hint="誰に向けた動画か(例:20代の美容好きな女性)"
                required
              >
                <input
                  type="text"
                  value={brief.target}
                  onChange={(e) => set("target", e.target.value)}
                  placeholder="例:23〜35歳の共働き世帯、時短に関心"
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="投稿テーマ" hint="何についての動画か" required>
                <input
                  type="text"
                  value={brief.theme}
                  onChange={(e) => set("theme", e.target.value)}
                  placeholder="例:新発売の冷凍弁当の紹介"
                  className={inputCls}
                  required
                />
              </Field>

              <Field
                label="参考トレンド・流行の型"
                hint="流行っている投稿、競合で見た型、使いたい構成など"
              >
                <textarea
                  value={brief.trendReference}
                  onChange={(e) => set("trendReference", e.target.value)}
                  placeholder="例:冒頭で失敗例を見せる、3選形式、コメントしたくなる二択、店舗の裏側密着"
                  rows={3}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="投稿目的" hint="選ぶと企画のゴールが明確になります">
                  <select
                    value={brief.goal}
                    onChange={(e) => set("goal", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">選択してください</option>
                    {GOAL_OPTIONS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="動画トーン" hint="見せ方の雰囲気">
                  <select
                    value={brief.tone}
                    onChange={(e) => set("tone", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">指定なし</option>
                    {TONE_OPTIONS.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="訴求ポイント・根拠"
                hint="価格、特徴、実績、比較優位、提供エリアなど"
              >
                <textarea
                  value={brief.sellingPoints}
                  onChange={(e) => set("sellingPoints", e.target.value)}
                  placeholder="例:当日予約OK、初回30分無料、地域密着で累計300件対応"
                  rows={3}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="演者">
                  <ToggleYesNo
                    value={brief.hasPerformer}
                    onChange={(v) => set("hasPerformer", v)}
                    yesLabel="あり(人物が出演)"
                    noLabel="なし(商品・テロップ中心)"
                  />
                </Field>
                <Field label="ナレーション">
                  <ToggleYesNo
                    value={brief.hasNarration}
                    onChange={(v) => set("hasNarration", v)}
                    yesLabel="あり(語り・セリフ)"
                    noLabel="なし(テロップ・BGM)"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="避けたい表現"
                  hint="使いたくない語句、誇大表現、断定回避など"
                >
                  <textarea
                    value={brief.avoidExpressions}
                    onChange={(e) => set("avoidExpressions", e.target.value)}
                    placeholder="例:絶対、業界No.1、競合名は使わない"
                    rows={3}
                    className={inputCls}
                  />
                </Field>
                <Field
                  label="使える素材"
                  hint="撮影で使える物や画面"
                >
                  <textarea
                    value={brief.availableAssets}
                    onChange={(e) => set("availableAssets", e.target.value)}
                    placeholder="例:店舗外観、商品パッケージ、スマホ画面、手元撮影"
                    rows={3}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field
                label="絶対に入れたい内容"
                hint="強み・根拠・NG回避したい表現もここに追記可"
              >
                <div className="relative">
                  <textarea
                    value={brief.mustInclude}
                    onChange={(e) => set("mustInclude", e.target.value)}
                    placeholder="例:価格は税込580円、初回送料無料、産地直送をアピール"
                    rows={3}
                    className={`${inputCls} pr-12`}
                  />
                  <Tooltip
                    label={
                      speechSupported
                        ? listening
                          ? "停止"
                          : "音声入力"
                        : "音声入力はChromeで利用できます"
                    }
                  >
                    <button
                      type="button"
                      onClick={listening ? stopListening : startListening}
                      disabled={!speechSupported}
                      className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        !speechSupported
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          : listening
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                      }`}
                      aria-label={listening ? "音声入力を停止" : "音声入力を開始"}
                    >
                      {listening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="動画の長さ">
                  <select
                    value={brief.durationSec}
                    onChange={(e) => set("durationSec", Number(e.target.value))}
                    className={inputCls}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}秒
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="CTA(視聴後にしてほしい行動)">
                  <input
                    type="text"
                    value={brief.cta}
                    onChange={(e) => set("cta", e.target.value)}
                    placeholder="例:プロフィールのリンクから購入"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="参考URL" hint="参考にしたい動画など(任意)">
                <input
                  type="text"
                  value={brief.referenceUrl}
                  onChange={(e) => set("referenceUrl", e.target.value)}
                  placeholder="https://..."
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="会社名">
                  <input
                    type="text"
                    value={brief.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    placeholder="例:株式会社サンプル"
                    className={inputCls}
                  />
                </Field>
                <Field label="会社URL" hint="任意">
                  <input
                    type="text"
                    value={brief.companyUrl}
                    onChange={(e) => set("companyUrl", e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </Field>
              </div>

              <button
                onClick={generatePlans}
                disabled={loadingPlans || missingRequired || generationDisabled}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loadingPlans
                  ? "企画案を生成中..."
                  : quotaExceeded
                    ? "今月の生成上限に達しました"
                    : "企画案を生成する"}
              </button>
            </div>
          )}

          {/* ========== 段階1:企画案の選択 ========== */}
          {step === "plans" && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("input")}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-4 h-4" />
                条件を修正する
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                企画案を選んでください ({plans.length})
              </h2>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      {p.angle}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {p.title}
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <Row label="狙い" value={p.concept} />
                    <Row label="冒頭フック" value={p.hook} />
                    <Row label="構成" value={p.outline} pre />
                    <Row label="トレンド適合" value={p.trendFit} />
                    <Row label="反応が起きる理由" value={p.buzzReason} />
                    <Row label="向いている目的" value={p.recommendedFor} />
                  </div>
                  <button
                    onClick={() => generateScript(p)}
                    disabled={loadingScript || generationDisabled}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Film className="w-4 h-4" />
                    {loadingScript && selectedPlan?.id === p.id
                      ? "台本を生成中..."
                      : quotaExceeded
                        ? "今月の生成上限に達しました"
                        : "この企画で台本を作る"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ========== 段階2:シーン別台本 ========== */}
          {step === "script" && script && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  onClick={() => setStep("plans")}
                  className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  別の企画案を見る
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyScript(script)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    コピー
                  </button>
                  <button
                    onClick={saveScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
              <ScriptView script={script} />
              <button
                onClick={resetFlow}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + 新しい台本を最初から作る
              </button>
            </div>
          )}
        </>
      )}

      {tab === "saved" && (
        <div className="space-y-4">
          {saved.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
              <Save className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                保存された台本はまだありません
              </p>
            </div>
          ) : (
            saved.map((s) => (
              <div key={s.id} className="space-y-2">
                <div className="flex items-center justify-end gap-2">
                  {s.savedAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-auto">
                      保存日:{s.savedAt}
                    </span>
                  )}
                  <button
                    onClick={() => copyScript(s)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label="コピー"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteScript(s.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                    aria-label="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <ScriptView script={s} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && (
          <span className="ml-2 inline-flex rounded bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-200">
            必須
          </span>
        )}
        {hint && (
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function ToggleYesNo({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 px-3 py-2.5 rounded-lg text-sm border transition-colors ${
          value
            ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
        }`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 px-3 py-2.5 rounded-lg text-sm border transition-colors ${
          !value
            ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
        }`}
      >
        {noLabel}
      </button>
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "input", label: "1. 条件入力" },
    { key: "plans", label: "2. 企画案を選ぶ" },
    { key: "script", label: "3. 台本完成" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              i <= idx
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-gray-300 dark:text-gray-600">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  pre,
}: {
  label: string;
  value: string;
  pre?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
        {label}
      </div>
      {pre ? (
        <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
          {value}
        </pre>
      ) : (
        <div className="text-gray-800 dark:text-gray-200">{value}</div>
      )}
    </div>
  );
}

function ScriptView({ script }: { script: GeneratedScript }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {script.planTitle}
        </h3>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          合計 {script.totalDurationSec}秒 / {script.scenes.length}シーン
        </span>
      </div>

      <div className="space-y-3">
        {script.scenes.map((sc) => (
          <div
            key={sc.sceneNo}
            className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-900 dark:bg-gray-700 text-white">
                シーン {sc.sceneNo}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {sc.durationSec}秒
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <SceneCell label="映像" value={sc.visual} />
              <SceneCell label="ナレーション" value={sc.narration || "—"} />
              <SceneCell label="テロップ" value={sc.caption} />
              <SceneCell label="SE" value={sc.se} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <div className="text-sm">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            CTA:
          </span>{" "}
          <span className="text-gray-800 dark:text-gray-200">{script.cta}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {script.hashtags.map((h) => (
            <span
              key={h}
              className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full"
            >
              #{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <div className="text-gray-800 dark:text-gray-200">{value}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
