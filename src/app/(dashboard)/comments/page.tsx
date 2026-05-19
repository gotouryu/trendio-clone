"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Filter,
  Send,
  Archive,
  MessageCircle,
  Search,
  X as XIcon,
} from "lucide-react";
import { mockComments } from "@/lib/mockData";
import type { CommentItem } from "@/lib/types";
import { useToast } from "@/components/providers/ToasterProvider";
import { useLocalStorage } from "@/lib/useLocalStorage";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

type SortKey = "newest" | "oldest" | "sentiment";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "sentiment", label: "Sentiment順" },
];

const sentimentRank: Record<CommentItem["sentiment"], number> = {
  positive: 0,
  neutral: 1,
  negative: 2,
};

export default function CommentsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [comments, setComments] = useLocalStorage<CommentItem[]>(
    "trendio-comments-state",
    mockComments,
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = comments;

    // Date filter
    if (filter !== "all" && filter !== "custom") {
      const now = new Date();
      const cutoff =
        filter === "today"
          ? new Date(now.setHours(0, 0, 0, 0))
          : filter === "7"
            ? new Date(now.setDate(now.getDate() - 7))
            : filter === "30"
              ? new Date(now.setDate(now.getDate() - 30))
              : null;
      if (cutoff) list = list.filter((c) => new Date(c.timestamp) >= cutoff);
    }

    // Search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q),
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "oldest")
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sentimentRank[a.sentiment] - sentimentRank[b.sentiment];
    });

    return list;
  }, [filter, sortBy, query, comments]);

  function handleReply(id: string) {
    if (!replyText.trim()) return;
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "replied" as const } : c)),
    );
    setReplyingTo(null);
    setReplyText("");
    toast("返信を送信しました", "success");
  }

  function handleArchive(id: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "archived" as const } : c)),
    );
    toast("アーカイブしました", "success");
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
    toast(`${ids.length} 件をアーカイブしました`, "success");
    setSelected(new Set());
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Comment Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor and manage Instagram comments
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="本文・ユーザー名で検索..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="コメントを検索"
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
              {s.label}
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
            {o.label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {filtered.length} 件のコメント
      </p>

      {/* Comments List */}
      <div className="space-y-3 mb-20">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              該当するコメントはありません
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
                  alt="post thumbnail"
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
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                    {c.text}
                  </p>

                  {replyingTo === c.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="返信を入力..."
                        className="flex-1 min-w-[200px] px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleReply(c.id)}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                        aria-label="返信を送信"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setReplyingTo(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200"
                      >
                        <Send className="w-3 h-3" />
                        返信
                      </button>
                      <button
                        onClick={() => handleArchive(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-200"
                      >
                        <Archive className="w-3 h-3" />
                        アーカイブ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk action bar (sticky bottom) */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            選択した {selected.size} 件
          </span>
          <button
            onClick={bulkArchive}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-medium"
          >
            <Archive className="w-3.5 h-3.5" />
            一括アーカイブ
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
            aria-label="選択解除"
          >
            <XIcon className="w-3 h-3" />
            選択解除
          </button>
        </div>
      )}
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: "positive" | "neutral" | "negative";
}) {
  const map = {
    positive: {
      label: "Positive",
      cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    },
    neutral: {
      label: "Neutral",
      cls: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
    },
    negative: {
      label: "Negative",
      cls: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    },
  };
  const m = map[sentiment];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: "unread" | "replied" | "archived";
}) {
  if (status === "unread")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
        未読
      </span>
    );
  if (status === "replied")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
        返信済み
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
      アーカイブ
    </span>
  );
}
