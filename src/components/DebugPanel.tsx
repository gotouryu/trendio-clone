"use client";

import { useEffect, useState } from "react";
import { Bug, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getSession } from "@/lib/authClient";

export default function DebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [storage, setStorage] = useState<Record<string, string>>({});
  const { locale } = useI18n();
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;
    if (window.location.search.includes("debug=1")) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("karteia-") || k.startsWith("customercare-"))) {
        const v = window.localStorage.getItem(k) ?? "";
        next[k] = v.length > 80 ? v.slice(0, 80) + "…" : v;
      }
    }
    setStorage(next);
  }, [open]);

  if (!enabled) return null;

  const session = getSession();

  function clearAll() {
    if (typeof window === "undefined") return;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("karteia-") || k.startsWith("customercare-"))) {
        window.localStorage.removeItem(k);
      }
    }
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-[150] w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 flex items-center justify-center"
        aria-label="Debug panel"
      >
        <Bug className="w-5 h-5" />
      </button>
      {open && (
        <div className="fixed right-0 top-0 h-screen w-80 z-[200] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              🐛 Debug Info
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-4 text-xs text-gray-700 dark:text-gray-300">
            <Block title="App">
              <Row k="NODE_ENV" v={process.env.NODE_ENV ?? "?"} />
              <Row
                k="APP_URL"
                v={process.env.NEXT_PUBLIC_APP_URL ?? "(unset)"}
              />
            </Block>
            <Block title="i18n / Theme">
              <Row k="locale" v={locale} />
              <Row k="theme" v={theme} />
              <Row k="resolved" v={resolvedTheme} />
            </Block>
            <Block title="Session">
              {session ? (
                <>
                  <Row k="email" v={session.email} />
                  <Row k="company" v={session.companyName} />
                  <Row k="loggedInAt" v={session.loggedInAt.slice(0, 19)} />
                </>
              ) : (
                <div className="text-gray-400">(no session)</div>
              )}
            </Block>
            <Block title={`localStorage (karteia-*) — ${Object.keys(storage).length}`}>
              {Object.entries(storage).map(([k, v]) => (
                <div key={k} className="break-all">
                  <span className="font-mono text-emerald-600">{k}</span>{" "}
                  <span className="text-gray-500">= {v}</span>
                </div>
              ))}
              {Object.keys(storage).length === 0 && (
                <div className="text-gray-400">(empty)</div>
              )}
            </Block>
            <button
              onClick={clearAll}
              className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium"
            >
              全データをクリアしてリロード
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 min-w-[80px]">{k}:</span>
      <span className="break-all">{v}</span>
    </div>
  );
}
