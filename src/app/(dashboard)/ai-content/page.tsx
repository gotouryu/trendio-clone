"use client";

import { useState } from "react";
import { Sparkles, Save, Trash2, Copy, Check } from "lucide-react";
import {
  industryOptions,
  goalOptions,
  mockContentIdeas,
} from "@/lib/mockData";
import type { ContentIdea } from "@/lib/types";

export default function AIContentPage() {
  const [tab, setTab] = useState<"new" | "saved">("new");
  const [industry, setIndustry] = useState("food-beverage");
  const [goal, setGoal] = useState("brand-awareness");
  const [extra, setExtra] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ContentIdea[]>([]);
  const [saved, setSaved] = useState<ContentIdea[]>(mockContentIdeas);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [generationError, setGenerationError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  async function generate() {
    setGenerating(true);
    setGenerationError(null);
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
    } catch (e) {
      setGenerationError(
        e instanceof Error ? e.message : "予期しないエラーが発生しました",
      );
    } finally {
      setGenerating(false);
    }
  }

  function saveItem(idea: ContentIdea) {
    if (saved.find((s) => s.id === idea.id)) return;
    setSaved([{ ...idea, savedAt: new Date().toISOString().slice(0, 10) }, ...saved]);
  }

  function deleteItem(id: string) {
    setSaved(saved.filter((s) => s.id !== id));
  }

  function copy(idea: ContentIdea) {
    const text = `${idea.title}\n\nフック: ${idea.hook}\n\n台本:\n${idea.script}\n\nハッシュタグ: ${idea.hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Content Planning</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered content ideas and script generation
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setTab("new")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "new"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            New Generation
          </button>
          <button
            onClick={() => setTab("saved")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "saved"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Saved ({saved.length})
          </button>
        </div>
      </div>

      {tab === "new" && (
        <>
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                {industryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marketing Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                {goalOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Requests (Optional)
              </label>
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="例:ターゲットは20代女性、カジュアルなトーン、商品特徴を強調"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {generationError}
            </div>
          )}

          {generated.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  生成された案 ({generated.length})
                </h2>
                {usingMock && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">
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
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
              <Save className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">保存されたコンテンツはまだありません</p>
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
    </div>
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
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                idea.platform === "instagram"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-gray-900 text-white"
              }`}
            >
              {idea.platform === "instagram" ? "Instagram" : "TikTok"}
            </span>
            {idea.savedAt && (
              <span className="text-xs text-gray-500">
                保存日:{idea.savedAt}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">{idea.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="コピー"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {!isSavedView && onSave && (
            <button
              onClick={onSave}
              disabled={saved}
              className={`p-2 rounded-lg ${saved ? "text-emerald-600 bg-emerald-50" : "hover:bg-gray-100 text-gray-600"}`}
              title="保存"
            >
              <Save className="w-4 h-4" />
            </button>
          )}
          {isSavedView && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">フック</div>
          <div className="text-gray-800">{idea.hook}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">台本</div>
          <pre className="text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-lg">
            {idea.script}
          </pre>
        </div>
        <div className="flex flex-wrap gap-1">
          {idea.hashtags.map((h) => (
            <span
              key={h}
              className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full"
            >
              #{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
