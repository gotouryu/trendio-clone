"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Save, Trash2, Copy, Check, Mic, MicOff, History, RotateCcw } from "lucide-react";
import { industryOptions, goalOptions, mockContentIdeas } from "@/lib/mockData";
import type { ContentIdea } from "@/lib/types";
import { useToast } from "@/components/providers/ToasterProvider";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Tooltip } from "@/components/ui/Tooltip";
import { useI18n } from "@/lib/i18n";

type HistoryItem = {
  id: string;
  timestamp: string;
  industry: string;
  goal: string;
  extra: string;
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
  const { t } = useI18n();
  const [tab, setTab] = useState<"new" | "saved" | "history">("new");
  const [industry, setIndustry] = useState("food-beverage");
  const [goal, setGoal] = useState("brand-awareness");
  const [extra, setExtra] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ContentIdea[]>([]);
  const [saved, setSaved] = useLocalStorage<ContentIdea[]>(
    "karteia-saved-content",
    mockContentIdeas,
  );
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(
    "karteia-generation-history",
    [],
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<ISpeechRecognition | null>(null);
  const speechSupported = !!getSpeechRecognition();

  useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  async function generate() {
    if (!industry || !goal) {
      // T3-1: フォーム空欄チェック
      toast(t("ai.toast.fieldRequired"), "error");
      return;
    }
    setGenerating(true);
    setGenerationError(null);
    // T3-2: 生成開始通知(=AI が考えてます)
    toast(t("ai.toast.generating"), "info");
    // log to history first
    setHistory((prev) =>
      [
        {
          id: `h-${Date.now()}`,
          timestamp: new Date().toISOString(),
          industry,
          goal,
          extra,
        },
        ...prev,
      ].slice(0, 50),
    );
    try {
      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, goal, extra, platform: "both" }),
      });
      const data = (await res.json()) as {
        ideas: ContentIdea[];
        mock?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setGenerated(data.ideas);
      setUsingMock(!!data.mock);
      // T3-3: 生成成功通知
      toast(t("ai.toast.generated", { n: data.ideas.length }), "success");
      // T3-4: Mock検知通知(=Claude APIキー未設定時の明示)
      if (data.mock) toast(t("ai.toast.usingMock"), "info");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "予期しないエラー";
      setGenerationError(msg);
      // T3-5: 生成失敗 toast(=既存の generationError 表示と併用)
      toast(t("ai.toast.genFailed", { msg }), "error");
    } finally {
      setGenerating(false);
    }
  }

  function saveItem(idea: ContentIdea) {
    if (saved.find((s) => s.id === idea.id)) {
      toast(t("ai.toast.alreadySaved"), "info");
      return;
    }
    setSaved((prev) => [
      { ...idea, savedAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    toast(t("ai.toast.saved"), "success");
  }

  function deleteItem(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast(t("ai.toast.deleted"), "info");
  }

  function copy(idea: ContentIdea) {
    const text = `${idea.title}\n\nフック: ${idea.hook}\n\n台本:\n${idea.script}\n\nハッシュタグ: ${idea.hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    toast(t("ai.toast.copied"), "success");
    setTimeout(() => setCopiedId(null), 1500);
  }

  function rerun(item: HistoryItem) {
    setIndustry(item.industry);
    setGoal(item.goal);
    setExtra(item.extra);
    setTab("new");
    toast(t("ai.toast.refilled"), "info");
  }

  function clearHistory() {
    const n = history.length;
    setHistory([]);
    // T3-6: 件数付き履歴削除通知(=旧:固定文言)
    toast(t("ai.toast.historyClearedN", { n }), "info");
  }

  function startListening() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      // T3-7: 音声入力非対応ブラウザの明示通知
      toast(t("ai.toast.voiceUnsupported"), "info");
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
      if (final) setExtra((prev) => (prev ? prev + " " + final : final));
    };
    rec.onend = () => {
      setListening(false);
      toast(t("ai.toast.voiceDone"), "success");
    };
    rec.onerror = () => {
      setListening(false);
      // T3-8: 音声入力エラー通知(=旧:無音で listening=false にしてた)
      toast(t("ai.toast.voiceError"), "error");
    };
    rec.start();
    recRef.current = rec;
    setListening(true);
    toast(t("ai.toast.recording"), "info");
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Content Planning</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered content ideas and script generation</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          <TabBtn active={tab === "new"} onClick={() => setTab("new")}>New Generation</TabBtn>
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")}>Saved ({saved.length})</TabBtn>
          <TabBtn active={tab === "history"} onClick={() => setTab("history")}>履歴 ({history.length})</TabBtn>
        </div>
      </div>

      {tab === "new" && (
        <>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 mb-6">
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="ai-industry">
                Select Industry
              </label>
              <select
                id="ai-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
              >
                {industryOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="ai-goal">
                Marketing Goal
              </label>
              <select
                id="ai-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
              >
                {goalOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="ai-extra">
                Additional Requests (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="ai-extra"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="例:ターゲットは20代女性、カジュアルなトーン、商品特徴を強調"
                  rows={4}
                  className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Tooltip label={speechSupported ? (listening ? "停止" : "音声入力") : "音声入力はChromeで利用できます"}>
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
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </Tooltip>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "AI が考えています..." : "Generate Content Ideas"}
            </button>
          </div>

          {generationError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-lg text-sm">
              {generationError}
            </div>
          )}

          {generated.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  生成された案 ({generated.length})
                </h2>
                {usingMock && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    Mock(=Claude APIキー未設定。本番では実AI生成)
                  </span>
                )}
              </div>
              {generated.map((g) => (
                <ContentCard
                  key={g.id}
                  idea={g}
                  onSave={() => saveItem(g)}
                  onCopy={() => copy(g)}
                  copied={copiedId === g.id}
                  saved={!!saved.find((s) => s.id === g.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "saved" && (
        <div className="space-y-4">
          {saved.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
              <Save className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">保存されたコンテンツはまだありません</p>
            </div>
          ) : (
            saved.map((s) => (
              <ContentCard
                key={s.id}
                idea={s}
                onCopy={() => copy(s)}
                onDelete={() => deleteItem(s.id)}
                copied={copiedId === s.id}
                isSavedView
              />
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              生成履歴
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:text-red-600"
              >
                履歴をクリア
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
              <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">履歴はまだありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const indLabel = industryOptions.find((o) => o.value === h.industry)?.label ?? h.industry;
                const goalLabel = goalOptions.find((o) => o.value === h.goal)?.label ?? h.goal;
                return (
                  <div
                    key={h.id}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(h.timestamp).toLocaleString("ja-JP")}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        <span className="font-medium">{indLabel}</span> × {goalLabel}
                      </div>
                      {h.extra && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {h.extra}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => rerun(h)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs hover:bg-emerald-100 dark:hover:bg-emerald-800"
                    >
                      <RotateCcw className="w-3 h-3" />
                      再実行
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function ContentCard({
  idea,
  onSave,
  onCopy,
  onDelete,
  copied,
  saved,
  isSavedView,
}: {
  idea: ContentIdea;
  onSave?: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  copied: boolean;
  saved?: boolean;
  isSavedView?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                idea.platform === "instagram"
                  ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                  : "bg-gray-900 dark:bg-gray-700 text-white"
              }`}
            >
              {idea.platform === "instagram" ? "Instagram" : "TikTok"}
            </span>
            {idea.savedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                保存日:{idea.savedAt}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{idea.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            aria-label="コピー"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          {!isSavedView && onSave && (
            <button
              onClick={onSave}
              disabled={saved}
              className={`p-2 rounded-lg ${saved ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
              aria-label="保存"
            >
              <Save className="w-4 h-4" />
            </button>
          )}
          {isSavedView && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
              aria-label="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">フック</div>
          <div className="text-gray-800 dark:text-gray-200">{idea.hook}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">台本</div>
          <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
            {idea.script}
          </pre>
        </div>
        <div className="flex flex-wrap gap-1">
          {idea.hashtags.map((h) => (
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
