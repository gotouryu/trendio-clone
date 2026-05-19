"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  MessageCircle,
  Flame,
  Sparkles,
  Settings,
} from "lucide-react";

type CmdItem = {
  label: string;
  path: string;
  Icon: typeof Search;
  hint: string;
};

const items: CmdItem[] = [
  { label: "ダッシュボード", path: "/dashboard", Icon: LayoutDashboard, hint: "Dashboard" },
  { label: "コメント", path: "/comments", Icon: MessageCircle, hint: "Comments" },
  { label: "トレンドを発見する", path: "/discover-trends", Icon: Flame, hint: "Trends" },
  { label: "AIコンテンツ", path: "/ai-content", Icon: Sparkles, hint: "AI Content" },
  { label: "アカウント設定", path: "/settings", Icon: Settings, hint: "Settings" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = items.filter(
    (i) =>
      i.label.includes(query) ||
      i.hint.toLowerCase().includes(query.toLowerCase()),
  );

  function go(path: string) {
    router.push(path);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) go(filtered[active].path);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/40 flex items-start justify-center pt-[20vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="機能を検索..."
            className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">
              結果なし
            </div>
          ) : (
            filtered.map(({ label, path, Icon, hint }, i) => (
              <button
                key={path}
                onClick={() => go(path)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${
                  i === active ? "bg-emerald-50" : "hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-800 flex-1 text-left">{label}</span>
                <span className="text-xs text-gray-400">{hint}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
          <span>↑↓ 選択 / Enter 移動 / Esc 閉じる</span>
          <kbd className="border border-gray-200 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
      </div>
    </div>
  );
}
