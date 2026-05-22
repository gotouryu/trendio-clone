"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Filter,
  Send,
  Archive,
  MessageCircle,
  Search,
  X as XIcon,
  Sparkles,
  Loader2,
  ListChecks,
  ShieldAlert,
  Clock,
} from "lucide-react";
import {
  mockComments,
  mockAutoReplyLogs,
  mockAutoReplySettings,
} from "@/lib/mockData";
import type { CommentItem, AutoReplyLog, AutoReplySettings } from "@/lib/types";
import { useToast } from "@/components/providers/ToasterProvider";
import KarteiaProcessBar, {
  KarteiaWelcomeHeader,
} from "@/components/KarteiaProcessBar";
import { getSession } from "@/lib/authClient";
import { useI18n } from "@/lib/i18n";

const filterOptions = [
  { value: "all", labelKey: "comments.filter.all" },
  { value: "today", labelKey: "comments.filter.today" },
  { value: "7", labelKey: "comments.filter.7" },
  { value: "30", labelKey: "comments.filter.30" },
];

type SortKey = "newest" | "oldest" | "sentiment";

const sortOptions: { value: SortKey; labelKey: string }[] = [
  { value: "newest", labelKey: "comments.sort.newest" },
  { value: "oldest", labelKey: "comments.sort.oldest" },
  { value: "sentiment", labelKey: "comments.sort.sentiment" },
];

const sentimentRank: Record<CommentItem["sentiment"], number> = {
  positive: 0,
  neutral: 1,
  negative: 2,
};

type Tab = "list" | "logs";

export default function CommentsPage() {
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  // localStorage 永続化は撤去:Instagram Graph API 接続後は ig_comments テーブルから取得。
  // 現在はデモ用 mockComments を初期表示し、ユーザーの返信/アーカイブ操作はメモリ内のみ保持。
  const [comments, setComments] = useState<CommentItem[]>(mockComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [aiGeneratingFor, setAiGeneratingFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyLogs, setAutoReplyLogs] = useState<AutoReplyLog[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [settings, setSettings] = useState<AutoReplySettings | null>(null);
  const [displayName, setDisplayName] = useState("お客様");
  const [nowMs] = useState(() => Date.now());

  // 初期ロード:セッション・設定・ログを取得
  // ⚠️ mockData fallback は **API 到達失敗時のみ** 適用。
  //    API 到達 (response.ok) かつ本番DBが 0件 = 実データそのまま反映(=空状態を表示)。
  //    旧実装は「0件 = mock 表示」のため、本番運用直後の整合性が壊れていた。
  useEffect(() => {
    const s = getSession();
    if (s?.displayName) setDisplayName(s.displayName);

    (async () => {
      try {
        const r = await fetch("/api/auto-reply/settings");
        if (!r.ok) {
          setSettings(mockAutoReplySettings);
          return;
        }
        const j = await r.json();
        if (j.settings) {
          setSettings(j.settings as AutoReplySettings);
          setAutoReplyEnabled(Boolean(j.settings.enabled));
        } else {
          setSettings(mockAutoReplySettings);
        }
      } catch {
        setSettings(mockAutoReplySettings);
      }
    })();

    (async () => {
      try {
        const r = await fetch("/api/auto-reply/logs?limit=50");
        if (!r.ok) {
          // API 到達失敗のみ mock
          setAutoReplyLogs(mockAutoReplyLogs);
          setMonthlyCount(mockAutoReplyLogs.length);
          return;
        }
        const j = await r.json();
        if (Array.isArray(j.logs)) {
          // 0 件でもそのまま表示(=本番運用直後の正しい挙動)
          setAutoReplyLogs(j.logs as AutoReplyLog[]);
        } else {
          setAutoReplyLogs(mockAutoReplyLogs);
        }
        if (typeof j.monthlyCount === "number") {
          setMonthlyCount(j.monthlyCount);
        } else {
          setMonthlyCount(0);
        }
      } catch {
        setAutoReplyLogs(mockAutoReplyLogs);
        setMonthlyCount(mockAutoReplyLogs.length);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = comments;

    if (filter !== "all") {
      const cutoff =
        filter === "today"
          ? (() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              return d;
            })()
          : filter === "7"
            ? new Date(nowMs - 7 * 24 * 3600 * 1000)
            : filter === "30"
              ? new Date(nowMs - 30 * 24 * 3600 * 1000)
              : null;
      if (cutoff) list = list.filter((c) => new Date(c.timestamp) >= cutoff);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q),
      );
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "oldest")
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sentimentRank[a.sentiment] - sentimentRank[b.sentiment];
    });

    return list;
  }, [filter, sortBy, query, comments, nowMs]);

  function handleReply(id: string) {
    if (!replyText.trim()) return;
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "replied" as const } : c)),
    );
    setReplyingTo(null);
    setReplyText("");
    toast(t("comments.toast.replySent"), "success");
  }

  function handleArchive(id: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "archived" as const } : c)),
    );
    toast(t("comments.toast.archived"), "success");
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkArchive() {
    const ids = Array.from(selected);
    setComments((prev) =>
      prev.map((c) =>
        ids.includes(c.id) ? { ...c, status: "archived" as const } : c,
      ),
    );
    toast(t("comments.toast.bulkArchived", { n: ids.length }), "success");
    setSelected(new Set());
  }

  /**
   * AI返信案を生成(=機能① 共P-01 無人受付 の手動承認モード)
   */
  const generateAiReply = useCallback(
    async (comment: CommentItem) => {
      setAiGeneratingFor(comment.id);
      setReplyingTo(comment.id);
      try {
        const res = await fetch("/api/ai-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId: comment.id,
            commentText: comment.text,
            customerHandle: comment.author,
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "AI返信生成に失敗しました");
        setReplyText(j.reply ?? "");
        toast(
          j.generated
            ? t("comments.toast.aiGenerated")
            : t("comments.toast.aiGeneratedFallback"),
          "success",
        );
      } catch (err) {
        toast(
          err instanceof Error ? err.message : t("comments.toast.aiFailed"),
          "error",
        );
      } finally {
        setAiGeneratingFor(null);
      }
    },
    [toast, t],
  );

  /**
   * 自動応答モードをサーバー側で切替
   */
  async function toggleAutoReply() {
    const next = !autoReplyEnabled;
    setAutoReplyEnabled(next);
    try {
      const res = await fetch("/api/auto-reply/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "切替失敗");
      toast(
        next ? t("comments.toast.autoOn") : t("comments.toast.autoOff"),
        next ? "success" : "info",
      );
    } catch (err) {
      // 失敗したらUIをロールバック
      setAutoReplyEnabled(!next);
      toast(
        err instanceof Error ? err.message : t("comments.toast.toggleFail"),
        "error",
      );
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <KarteiaProcessBar current="unattended" />
      {(() => {
        const unread = comments.filter((c) => c.status === "unread").length;
        return (
          <KarteiaWelcomeHeader
            greeting={t("greeting.welcome", { name: displayName })}
            title={t("comments.title")}
            subtitle={
              unread > 0
                ? t("comments.subtitle.unread", { n: unread })
                : t("comments.subtitle.allDone")
            }
          />
        );
      })()}

      {/* Auto-Reply Mode Toggle */}
      <div
        className={`rounded-xl p-5 mb-5 border ${
          autoReplyEnabled
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
        }`}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                autoReplyEnabled
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t("comments.autoReplyMode")}
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    autoReplyEnabled
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {autoReplyEnabled ? t("comments.autoReplyOn") : t("comments.autoReplyOff")}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
                {t("comments.autoReplyDesc")}
              </p>
              {settings && autoReplyEnabled && (
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t("comments.businessHours")}: {settings.businessHours.start}–
                    {settings.businessHours.end}
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="w-3 h-3" />
                    {t("comments.faqCount", { n: settings.faqPatterns.filter((f) => f.enabled).length })}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {t("comments.ngCount", { n: settings.ngKeywords.length })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={toggleAutoReply}
            role="switch"
            aria-checked={autoReplyEnabled}
            className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
              autoReplyEnabled
                ? "bg-emerald-500"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            aria-label="自動応答モードを切替"
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                autoReplyEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4 flex gap-1">
        <TabButton
          active={activeTab === "list"}
          onClick={() => setActiveTab("list")}
          label={t("comments.tab.list")}
          count={comments.filter((c) => c.status === "unread").length}
        />
        <TabButton
          active={activeTab === "logs"}
          onClick={() => setActiveTab("logs")}
          label={t("comments.tab.logs")}
          count={monthlyCount}
          badge={monthlyCount > 0 ? `${monthlyCount}` : undefined}
        />
      </div>

      {activeTab === "list" ? (
        <>
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("comments.search")}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label={t("common.search")}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="並び替え"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 mb-4 flex items-center gap-2 overflow-x-auto">
            <Filter
              className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0"
              aria-hidden
            />
            {filterOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setFilter(o.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  filter === o.value
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {t(o.labelKey)}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t("comments.count", { n: filtered.length })}
          </p>

          {/* Comments List */}
          <div className="space-y-3 mb-20">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t("comments.empty")}
                </p>
              </div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="mt-1.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      aria-label={`${c.author}のコメントを選択`}
                    />
                    <Image
                      src={c.postThumbnail}
                      alt="投稿サムネイル"
                      width={64}
                      height={64}
                      className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg object-cover flex-shrink-0"
                      unoptimized
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Image
                          src={c.authorAvatar}
                          alt={`${c.author}のアバター`}
                          width={32}
                          height={32}
                          className="w-7 sm:w-8 h-7 sm:h-8 rounded-full"
                          unoptimized
                        />
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          @{c.author}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(c.timestamp).toLocaleString("ja-JP", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <SentimentBadge sentiment={c.sentiment} />
                        <StatusBadge status={c.status} />
                        {c.category && <CategoryBadge category={c.category} />}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                        {/* Phase 4 修正:demo 用 mockComments のみ textEn を表示
                            (=実 Instagram コメントは元言語のまま) */}
                        {locale === "en" && c.textEn ? c.textEn : c.text}
                      </p>

                      {replyingTo === c.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t("comments.placeholder")}
                            rows={3}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => generateAiReply(c)}
                              disabled={aiGeneratingFor === c.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium disabled:opacity-50"
                            >
                              {aiGeneratingFor === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              {aiGeneratingFor === c.id
                                ? t("comments.aiReply.generating")
                                : t("comments.aiReply.regenerate")}
                            </button>
                            <button
                              onClick={() => handleReply(c.id)}
                              disabled={!replyText.trim()}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                              aria-label={t("comments.send")}
                            >
                              <Send className="w-3.5 h-3.5" />
                              {t("comments.send")}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
                            >
                              {t("comments.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => generateAiReply(c)}
                            disabled={aiGeneratingFor === c.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium disabled:opacity-50"
                          >
                            {aiGeneratingFor === c.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            {aiGeneratingFor === c.id
                              ? t("comments.aiReply.generating")
                              : t("comments.aiReply")}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(c.id);
                              setReplyText("");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200"
                          >
                            <Send className="w-3 h-3" />
                            {t("comments.manualReply")}
                          </button>
                          <button
                            onClick={() => handleArchive(c.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200"
                          >
                            <Archive className="w-3 h-3" />
                            {t("comments.archive")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        // 自動応答ログタブ
        <LogsTab logs={autoReplyLogs} monthlyCount={monthlyCount} />
      )}

      {/* Bulk action bar */}
      {activeTab === "list" && selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {t("comments.bulk.selected", { n: selected.size })}
          </span>
          <button
            onClick={bulkArchive}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-medium"
          >
            <Archive className="w-3.5 h-3.5" />
            {t("comments.bulk.archive")}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
            aria-label={t("comments.bulk.deselect")}
          >
            <XIcon className="w-3 h-3" />
            {t("comments.bulk.deselect")}
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      <span className="flex items-center gap-2">
        {label}
        {badge ? (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              active
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {badge}
          </span>
        ) : (
          typeof count === "number" &&
          count > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {count}
            </span>
          )
        )}
      </span>
    </button>
  );
}

function LogsTab({
  logs,
  monthlyCount,
}: {
  logs: AutoReplyLog[];
  monthlyCount: number;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t("comments.logs.monthly", { n: monthlyCount })}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {t("comments.logs.desc")}
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
          <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t("comments.logs.empty")}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t("comments.logs.emptyDesc")}
          </p>
        </div>
      ) : (
        logs.map((log) => <LogRow key={log.id} log={log} />)
      )}
    </div>
  );
}

function LogRow({ log }: { log: AutoReplyLog }) {
  const { t, locale } = useI18n();
  const triggerLabel = {
    faq_match: locale === "en" ? "FAQ Auto-Reply" : "FAQ自動応答",
    business_hours_out: locale === "en" ? "After-Hours Reply" : "営業時間外応答",
    manual_trigger: locale === "en" ? "Manual Trigger" : "手動トリガー",
  }[log.triggerReason];

  const statusBadge =
    log.status === "sent"
      ? {
          label: locale === "en" ? "Sent" : "送信済み",
          cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
        }
      : log.status === "blocked_ng"
        ? {
            label: locale === "en" ? "Blocked (NG)" : "NGワード遮断",
            cls: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
          }
        : {
            label: locale === "en" ? "Failed" : "失敗",
            cls: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
          };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-start gap-3">
        {log.customerAvatar && (
          <Image
            src={log.customerAvatar}
            alt={log.customerHandle}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full flex-shrink-0"
            unoptimized
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              @{log.customerHandle}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(log.repliedAt).toLocaleString("ja-JP", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {triggerLabel}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
            {log.matchedKeyword && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                マッチ: {log.matchedKeyword}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t("comments.logs.original")}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-2 bg-gray-50 dark:bg-gray-900 rounded px-3 py-2">
            {log.originalComment}
          </p>
          {log.generatedReply && (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t("comments.logs.aiReply")}
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-100 bg-emerald-50 dark:bg-emerald-900/20 rounded px-3 py-2">
                {log.generatedReply}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: "positive" | "neutral" | "negative";
}) {
  const { t } = useI18n();
  const cls = {
    positive: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    neutral: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
    negative: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  }[sentiment];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {t(`comments.sentiment.${sentiment}`)}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: "unread" | "replied" | "archived";
}) {
  const { t } = useI18n();
  const cls = {
    unread: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    replied:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    archived:
      "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
  }[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {t(`comments.status.${status}`)}
    </span>
  );
}

function CategoryBadge({
  category,
}: {
  category: NonNullable<CommentItem["category"]>;
}) {
  const { t } = useI18n();
  const cls = {
    product_inquiry: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    business_hours: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    complaint: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    positive: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    other: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
  }[category];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {t(`comments.category.${category}`)}
    </span>
  );
}
