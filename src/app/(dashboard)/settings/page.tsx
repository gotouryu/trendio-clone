"use client";

import { useState, useEffect, useCallback } from "react";
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
  Clock,
  Trash2,
  Plus,
  ShieldAlert,
  ListChecks,
  Save,
  Loader2,
} from "lucide-react";
import { getSession } from "@/lib/authClient";
import { useToast } from "@/components/providers/ToasterProvider";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { useI18n, type Locale } from "@/lib/i18n";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { AutoReplySettings, FaqPattern } from "@/lib/types";

type Profile = {
  companyName: string;
  language: Locale;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();

  const [profile, setProfile] = useLocalStorage<Profile>(
    "customercare-settings-profile",
    { companyName: "", language: "ja" },
  );
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState(profile.companyName);
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [tiktokConnected, setTiktokConnected] = useState(false);

  // 自動応答ルール設定
  const [arSettings, setArSettings] = useState<AutoReplySettings | null>(null);
  const [savingAr, setSavingAr] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session && !profile.companyName) {
      setProfile((p) => ({ ...p, companyName: session.companyName }));
      setEditingName(session.companyName);
    }
  }, [profile.companyName, setProfile]);

  useEffect(() => {
    if (profile.language !== locale) {
      setLocale(profile.language);
    }
  }, [profile.language, locale, setLocale]);

  useEffect(() => {
    fetch("/api/auto-reply/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.settings) setArSettings(j.settings as AutoReplySettings);
      })
      .catch(() => {
        /* 未認証時はスキップ */
      });
  }, []);

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

  const saveAutoReply = useCallback(
    async (next: AutoReplySettings) => {
      setArSettings(next);
      setSavingAr(true);
      try {
        const res = await fetch("/api/auto-reply/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "保存失敗");
        toast("自動応答ルールを保存しました", "success");
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "保存に失敗しました",
          "error",
        );
      } finally {
        setSavingAr(false);
      }
    },
    [toast],
  );

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        アカウント設定
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
        SNSアカウントの接続、表示、自動応答ルールを管理する
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
              表示言語
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              アプリの表示言語を選択してください
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
                会社・組織名
              </div>
              {editing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="株式会社○○"
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
                  {profile.companyName || (
                    <span className="text-sm text-gray-400">未設定</span>
                  )}
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
                編集
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
                    接続済み
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Meta 公式 Graph API 経由で Instagram ビジネスアカウントを連携
              </div>
            </div>
            {instagramConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast("同期を開始しました", "info")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  同期
                </button>
                <button
                  onClick={() => {
                    setInstagramConnected(false);
                    toast("Instagramの接続を解除しました", "info");
                  }}
                  className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
                >
                  接続解除
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
                接続
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
                    接続済み
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                TikTok API 再申請中、採択後の追加対応予定
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
                接続解除
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
                接続
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
                接続のヒント
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    InstagramはFacebookビジネスアカウントと連携している必要があります
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    TikTokはビジネスまたはクリエイターアカウントが必要です
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    データの同期は接続後最大24時間かかる場合があります
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Auto-Reply Rules */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          自動応答ルール設定
          {savingAr && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          機能① AI顧客応答機能の自動応答モードで使用するルール(=共P-01 無人受付の判定条件)
        </p>

        {arSettings && (
          <>
            {/* Business Hours */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  営業時間
                </h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={arSettings.businessHours.enabled}
                    onChange={(e) =>
                      saveAutoReply({
                        ...arSettings,
                        businessHours: {
                          ...arSettings.businessHours,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 dark:text-gray-200">
                    営業時間内は手動承認、時間外は自動応答
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={arSettings.businessHours.start}
                    onChange={(e) =>
                      saveAutoReply({
                        ...arSettings,
                        businessHours: {
                          ...arSettings.businessHours,
                          start: e.target.value,
                        },
                      })
                    }
                    className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    aria-label="営業開始時刻"
                  />
                  <span className="text-gray-500">–</span>
                  <input
                    type="time"
                    value={arSettings.businessHours.end}
                    onChange={(e) =>
                      saveAutoReply({
                        ...arSettings,
                        businessHours: {
                          ...arSettings.businessHours,
                          end: e.target.value,
                        },
                      })
                    }
                    className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    aria-label="営業終了時刻"
                  />
                  <span className="text-xs text-gray-500">
                    ({arSettings.businessHours.timezone})
                  </span>
                </div>
              </div>
            </div>

            {/* FAQ Patterns */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-3">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    FAQパターン
                    <span className="text-xs text-gray-400 ml-2">
                      {arSettings.faqPatterns.length} 件
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() =>
                    saveAutoReply({
                      ...arSettings,
                      faqPatterns: [
                        ...arSettings.faqPatterns,
                        {
                          id: `faq-${Date.now()}`,
                          keyword: "",
                          reply: "",
                          enabled: true,
                        },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  追加
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                コメントにキーワードが含まれていたら定型文で自動応答します
              </p>
              <div className="space-y-3">
                {arSettings.faqPatterns.map((pattern, idx) => (
                  <FaqEditor
                    key={pattern.id}
                    pattern={pattern}
                    onChange={(next) => {
                      const arr = [...arSettings.faqPatterns];
                      arr[idx] = next;
                      saveAutoReply({ ...arSettings, faqPatterns: arr });
                    }}
                    onDelete={() => {
                      const arr = arSettings.faqPatterns.filter(
                        (_, i) => i !== idx,
                      );
                      saveAutoReply({ ...arSettings, faqPatterns: arr });
                    }}
                  />
                ))}
                {arSettings.faqPatterns.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                    FAQパターンがまだありません。「追加」で作成してください。
                  </p>
                )}
              </div>
            </div>

            {/* NG Keywords */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  NGワード
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                これらの語が含まれるコメントには自動応答しません(=機械的応答を避けるべき内容、Human-in-the-Loop)
              </p>
              <NgKeywordEditor
                keywords={arSettings.ngKeywords}
                onChange={(keywords) =>
                  saveAutoReply({ ...arSettings, ngKeywords: keywords })
                }
              />
            </div>

            {/* Default Template */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Save className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  デフォルト応答テンプレ
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                FAQに該当しないコメントが営業時間外に来た場合の応答(空欄なら応答しない)
              </p>
              <textarea
                value={arSettings.defaultTemplate}
                onChange={(e) =>
                  setArSettings({
                    ...arSettings,
                    defaultTemplate: e.target.value,
                  })
                }
                onBlur={() => saveAutoReply(arSettings)}
                rows={3}
                placeholder="例:お問い合わせありがとうございます。担当者より順次お返事いたします。"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </>
        )}
        {!arSettings && (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">設定を読み込み中...</p>
          </div>
        )}
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

function FaqEditor({
  pattern,
  onChange,
  onDelete,
}: {
  pattern: FaqPattern;
  onChange: (next: FaqPattern) => void;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState(pattern);
  useEffect(() => setLocal(pattern), [pattern]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-start gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={local.enabled}
            onChange={(e) =>
              onChange({ ...local, enabled: e.target.checked })
            }
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-gray-600 dark:text-gray-300">有効</span>
        </label>
        <input
          value={local.keyword}
          onChange={(e) => setLocal({ ...local, keyword: e.target.value })}
          onBlur={() => onChange(local)}
          placeholder="キーワード(例:営業時間)"
          className="flex-1 min-w-[150px] px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-xs"
        />
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 p-1"
          aria-label="削除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={local.reply}
        onChange={(e) => setLocal({ ...local, reply: e.target.value })}
        onBlur={() => onChange(local)}
        rows={2}
        placeholder="定型応答文"
        className="w-full mt-2 px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-xs"
      />
    </div>
  );
}

function NgKeywordEditor({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (k: string[]) => void;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (!v) return;
    if (keywords.includes(v)) return;
    onChange([...keywords, v]);
    setInput("");
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="NGワードを入力 (Enterで追加)"
          className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
        />
        <button
          onClick={add}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium"
        >
          追加
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((k, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full"
          >
            {k}
            <button
              onClick={() => onChange(keywords.filter((_, i) => i !== idx))}
              className="hover:text-red-900 dark:hover:text-red-100"
              aria-label={`${k}を削除`}
            >
              ×
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <span className="text-xs text-gray-400">NGワードはありません</span>
        )}
      </div>
    </div>
  );
}
