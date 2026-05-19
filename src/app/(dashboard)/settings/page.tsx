"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  RefreshCw,
  Link2,
  Instagram,
  Lightbulb,
  Check,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { getSession } from "@/lib/authClient";
import { useToast } from "@/components/providers/ToasterProvider";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { useI18n, type Locale } from "@/lib/i18n";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Profile = {
  companyName: string;
  language: Locale;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();

  const [profile, setProfile] = useLocalStorage<Profile>(
    "trendio-settings-profile",
    { companyName: "サンプル", language: "ja" },
  );
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState(profile.companyName);
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [tiktokConnected, setTiktokConnected] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session && profile.companyName === "サンプル") {
      setProfile((p) => ({ ...p, companyName: session.companyName }));
      setEditingName(session.companyName);
    }
  }, [profile.companyName, setProfile]);

  // Keep i18n locale in sync with persisted profile
  useEffect(() => {
    if (profile.language !== locale) {
      setLocale(profile.language);
    }
  }, [profile.language, locale, setLocale]);

  function saveCompany() {
    setProfile((p) => ({ ...p, companyName: editingName }));
    setEditing(false);
    toast("会社情報を保存しました", "success");
  }

  function changeLanguage(lang: Locale) {
    setProfile((p) => ({ ...p, language: lang }));
    setLocale(lang);
    toast(
      lang === "ja" ? "言語を日本語に切り替えました" : "Language switched to English",
      "success",
    );
  }

  function changeTheme(t: Theme) {
    setTheme(t);
    const label =
      t === "light" ? "ライト" : t === "dark" ? "ダーク" : "システム";
    toast(`テーマを${label}に切り替えました`, "success");
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        アカウント設定
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
        SNSアカウントの接続と設定を管理する
      </p>

      {/* Theme */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          テーマ
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                外観モード
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ライト・ダーク・システム設定から選択
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <ThemePill
                active={theme === "light"}
                onClick={() => changeTheme("light")}
                icon={<Sun className="w-4 h-4" />}
                label="ライト"
              />
              <ThemePill
                active={theme === "dark"}
                onClick={() => changeTheme("dark")}
                icon={<Moon className="w-4 h-4" />}
                label="ダーク"
              />
              <ThemePill
                active={theme === "system"}
                onClick={() => changeTheme("system")}
                icon={<Laptop className="w-4 h-4" />}
                label="システム"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          言語
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Language
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select your preferred language
            </div>
          </div>
          <select
            value={profile.language}
            onChange={(e) => changeLanguage(e.target.value as Locale)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="言語を選択"
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      {/* Company Info */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          会社情報
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company / Organization Name
              </div>
              {editing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 min-w-[150px] px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={saveCompany}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditingName(profile.companyName);
                    }}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {profile.companyName}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                サイドバーに表示される名前です
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                aria-label="会社情報を編集"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SNS Connections */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          SNSアカウント接続
        </h2>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="ig-icon-bg w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Instagram
                </span>
                {instagramConnected && (
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                    Connected
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Followers: ・ Last sync:
              </div>
            </div>
            {instagramConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast("同期を開始しました", "info")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync
                </button>
                <button
                  onClick={() => {
                    setInstagramConnected(false);
                    toast("Instagramの接続を解除しました", "info");
                  }}
                  className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setInstagramConnected(true);
                  toast("Instagramに接続しました", "success");
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="tt-icon-bg w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  TikTok
                </span>
                {tiktokConnected && (
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                    Connected
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                TikTok Businessアカウントを接続する
              </div>
            </div>
            {tiktokConnected ? (
              <button
                onClick={() => {
                  setTiktokConnected(false);
                  toast("TikTokの接続を解除しました", "info");
                }}
                className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => {
                  setTiktokConnected(true);
                  toast("TikTokに接続しました", "success");
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Connection Tips */}
      <section className="mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connection Tips
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>InstagramはFacebookビジネスアカウントと連携している必要があります</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>TikTokはビジネスまたはクリエイターアカウントが必要です</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>データの同期は接続後最大24時間かかる場合があります</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ThemePill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-emerald-500 text-white"
          : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
      }`}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}
