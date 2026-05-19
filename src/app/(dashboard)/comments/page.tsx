"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Filter, Send, Archive, MessageCircle } from "lucide-react";
import { mockComments } from "@/lib/mockData";
import type { CommentItem } from "@/lib/types";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

export default function CommentsPage() {
  const [filter, setFilter] = useState("all");
  const [comments, setComments] = useState<CommentItem[]>(mockComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return comments;
    const now = new Date();
    const cutoff =
      filter === "today"
        ? new Date(now.setHours(0, 0, 0, 0))
        : filter === "7"
          ? new Date(now.setDate(now.getDate() - 7))
          : filter === "30"
            ? new Date(now.setDate(now.getDate() - 30))
            : null;
    if (!cutoff) return comments;
    return comments.filter((c) => new Date(c.timestamp) >= cutoff);
  }, [filter, comments]);

  function handleReply(id: string) {
    if (!replyText.trim()) return;
    setComments(
      comments.map((c) =>
        c.id === id ? { ...c, status: "replied" as const } : c,
      ),
    );
    setReplyingTo(null);
    setReplyText("");
  }

  function handleArchive(id: string) {
    setComments(
      comments.map((c) =>
        c.id === id ? { ...c, status: "archived" as const } : c,
      ),
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comment Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor and manage Instagram comments
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 mb-4 flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" />
        {filterOptions.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === o.value
                ? "bg-emerald-500 text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">該当するコメントはありません</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-100 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <Image
                  src={c.postThumbnail}
                  alt="post"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg object-cover"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Image
                      src={c.authorAvatar}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                      unoptimized
                    />
                    <span className="font-medium text-gray-900 text-sm">
                      @{c.author}
                    </span>
                    <span className="text-xs text-gray-500">
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
                  <p className="text-sm text-gray-800 mb-3">{c.text}</p>

                  {replyingTo === c.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="返信を入力..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleReply(c.id)}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-2 text-sm text-gray-500"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReplyingTo(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700"
                      >
                        <Send className="w-3 h-3" />
                        返信
                      </button>
                      <button
                        onClick={() => handleArchive(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700"
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
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: "positive" | "neutral" | "negative";
}) {
  const map = {
    positive: { label: "Positive", cls: "bg-emerald-50 text-emerald-700" },
    neutral: { label: "Neutral", cls: "bg-gray-100 text-gray-600" },
    negative: { label: "Negative", cls: "bg-red-50 text-red-700" },
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
  if (status === "unread") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
        未読
      </span>
    );
  }
  if (status === "replied") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        返信済み
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      アーカイブ
    </span>
  );
}
