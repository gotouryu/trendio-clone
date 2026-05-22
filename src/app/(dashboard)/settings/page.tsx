"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
import { mockAutoReplySettings } from "@/lib/mockData";

type Profile = {
  companyName: string;
  language: Locale;
};

// TikTok 連携は当面見送る方針(#6)。表示だけ消し、ロジックは残す。再開時は true に。
const SHOW_TIKTOK = false;

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useLocalStorage<Profile>(
    "customercare-settings-profile",
    { companyName: "", language: "ja" },
  );
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState(profile.companyName);
  // 初期は未接続として描画。/api/sns/accounts の結果で確定する
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [snsLoading, setSnsLoading] = useState(true);

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

  // Phase 4 修正:profile.language → locale の自動上書きは廃止
  // (=旧:profile.language="ja" デフォルトが locale="en"(navigator.language 推定値)
  // を毎回 ja に上書きしていたバグ。Language は changeLanguage() で明示変更時のみ反映)

  useEffect(() => {
    fetch("/api/auto-reply/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.settings) {
          setArSettings(j.settings as AutoReplySettings);
        } else {
          // 本番DB未登録時のデモ表示用フォールバック
          setArSettings(mockAutoReplySettings);
        }
      })
      .catch(() => {
        setArSettings(mockAutoReplySettings);
      });
  }, []);

  // SNS 接続状態を取得 + OAuth コールバック後のメッセージ表示
  const refreshSnsAccounts = useCallback(async () => {
    setSnsLoading(true);
    try {
      const r = await fetch("/api/sns/accounts");
      if (!r.ok) throw new Error("接続状態取得失敗");
      const j = (await r.json()) as {
        accounts: { platform: "instagram" | "tiktok" }[];
      };
      setInstagramConnected(j.accounts.some((a) => a.platform === "instagram"));
      setTiktokConnected(j.accounts.some((a) => a.platform === "tiktok"));
    } catch {
      // 取得失敗時は未接続扱い
      setInstagramConnected(false);
      setTiktokConnected(false);
    } finally {
      setSnsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSnsAccounts();
  }, [refreshSnsAccounts]);

  // OAuth コールバックからの戻り(=`?connected=instagram` or `?error=xxx`)を検知してトースト
  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "instagram") toast(t("settings.toast.instagramConnected"), "success");
    else if (connected === "tiktok") toast(t("settings.toast.tiktokConnected"), "success");
    else if (err) {
      const keyMap: Record<string, string> = {
        meta_not_configured: "settings.oauth.err.metaNotConfigured",
        tiktok_not_configured: "settings.oauth.err.tiktokNotConfigured",
        state_mismatch: "settings.oauth.err.stateMismatch",
        user_mismatch: "settings.oauth.err.userMismatch",
        token_exchange_failed: "settings.oauth.err.tokenExchangeFailed",
        no_ig_business_account: "settings.oauth.err.noIgBusinessAccount",
        db_upsert_failed: "settings.oauth.err.dbUpsertFailed",
        missing_code: "settings.oauth.err.missingCode",
        supabase_not_configured: "settings.oauth.err.supabaseNotConfigured",
      };
      toast(
        keyMap[err] ? t(keyMap[err]) : t("settings.oauth.err.unknown"),
        "error",
      );
    }
    // URL をきれいにする(=リロード時に同じトーストが出続けないように)
    if (connected || err) {
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, toast, t]);

  async function disconnectSns(platform: "instagram" | "tiktok") {
    try {
      const r = await fetch(`/api/sns/accounts?platform=${platform}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("切断失敗");
      await refreshSnsAccounts();
      toast(
        platform === "instagram"
          ? t("settings.toast.instagramDisconnected")
          : t("settings.toast.tiktokDisconnected"),
        "info",
      );
    } catch (e) {
      toast(
        e instanceof Error ? e.message : t("settings.toast.disconnectFail"),
        "error",
      );
    }
  }

  function saveCompany() {
    setProfile((p) => ({ ...p, companyName: editingName }));
    setEditing(false);
    toast(t("settings.toast.companyUpdated"), "success");
  }

  function changeLanguage(lang: Locale) {
    setProfile((p) => ({ ...p, language: lang }));
    setLocale(lang);
    toast(
      lang === "ja" ? t("settings.toast.langJa") : t("settings.toast.langEn"),
      "success",
    );
  }

  function changeTheme(th: Theme) {
    setTheme(th);
    const labelKey =
      th === "light"
        ? "settings.theme.label.light"
        : th === "dark"
          ? "settings.theme.label.dark"
          : "settings.theme.label.system";
    toast(t("settings.toast.themeChanged", { label: t(labelKey) }), "success");
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
        {t("settings.title")}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
        {t("settings.subtitle")}
      </p>

      {/* Theme */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("settings.theme")}
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {t("settings.theme.appearance")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t("settings.theme.appearance.sub")}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <ThemePill
                active={theme === "light"}
                onClick={() => changeTheme("light")}
                icon={<Sun className="w-4 h-4" />}
                label={t("settings.theme.light")}
              />
              <ThemePill
                active={theme === "dark"}
                onClick={() => changeTheme("dark")}
                icon={<Moon className="w-4 h-4" />}
                label={t("settings.theme.dark")}
              />
              <ThemePill
                active={theme === "system"}
                onClick={() => changeTheme("system")}
                icon={<Laptop className="w-4 h-4" />}
                label={t("settings.theme.system")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("settings.language")}
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {t("settings.language.display")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t("settings.language.sub")}
            </div>
          </div>
          <select
            value={locale}
            onChange={(e) => changeLanguage(e.target.value as Locale)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={t("settings.language")}
          >
            <option value="ja">{t("settings.language.ja")}</option>
            <option value="en">{t("settings.language.en")}</option>
          </select>
        </div>
      </section>

      {/* Company Info */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("settings.company")}
        </h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("settings.company.name")}
              </div>
              {editing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder={t("settings.company.placeholder")}
                    className="flex-1 min-w-[150px] px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={saveCompany}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                  >
                    {t("common.save")}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditingName(profile.companyName);
                    }}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {profile.companyName || (
                    <span className="text-sm text-gray-400">{t("settings.company.unset")}</span>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("settings.company.help")}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                aria-label={t("settings.company.editAria")}
              >
                <Pencil className="w-3.5 h-3.5" />
                {t("common.edit")}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SNS Connections */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("settings.snsConnections")}
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
                    {t("common.connected")}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("settings.sns.instagram.desc")}
              </div>
            </div>
            {snsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : instagramConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast(t("settings.sync.started"), "info")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t("common.sync")}
                </button>
                <button
                  onClick={() => disconnectSns("instagram")}
                  className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
                >
                  接続解除
                </button>
              </div>
            ) : (
              // Meta OAuth フローへ遷移(=server で META_APP_ID 等の env チェック)
              <a
                href="/api/auth/instagram/start"
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                <Link2 className="w-3.5 h-3.5" />
                {t("common.connect")}
              </a>
            )}
          </div>
        </div>

        {SHOW_TIKTOK && (
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
                    {t("common.connected")}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("settings.sns.tiktok.desc")}
              </div>
            </div>
            {snsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : tiktokConnected ? (
              <button
                onClick={() => disconnectSns("tiktok")}
                className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
              >
                {t("common.disconnect")}
              </button>
            ) : (
              <a
                href="/api/auth/tiktok/start"
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                <Link2 className="w-3.5 h-3.5" />
                {t("common.connect")}
              </a>
            )}
          </div>
        </div>
        )}
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
                {t("settings.sns.tips")}
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{t("settings.sns.tips.ig")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{t("settings.sns.tips.tt")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{t("settings.sns.tips.sync")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Auto-Reply Rules */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          {t("settings.autoReplyRules")}
          {savingAr && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {t("settings.autoReply.desc")}
        </p>

        {arSettings && (
          <>
            {/* Business Hours */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {t("settings.businessHours.title")}
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
                    {t("settings.businessHours.modeDesc")}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Phase 4 修正:onChange は local 更新のみ、onBlur で save
                      (=旧:onChange ごとに PUT で WAL 圧迫していた問題、Phase 2-E H6) */}
                  <input
                    type="time"
                    defaultValue={arSettings.businessHours.start}
                    onBlur={(e) => {
                      if (e.target.value !== arSettings.businessHours.start) {
                        saveAutoReply({
                          ...arSettings,
                          businessHours: {
                            ...arSettings.businessHours,
                            start: e.target.value,
                          },
                        });
                      }
                    }}
                    className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    aria-label={t("settings.businessHours.startAria")}
                  />
                  <span className="text-gray-500">–</span>
                  <input
                    type="time"
                    defaultValue={arSettings.businessHours.end}
                    onBlur={(e) => {
                      if (e.target.value !== arSettings.businessHours.end) {
                        saveAutoReply({
                          ...arSettings,
                          businessHours: {
                            ...arSettings.businessHours,
                            end: e.target.value,
                          },
                        });
                      }
                    }}
                    className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    aria-label={t("settings.businessHours.endAria")}
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
                    {t("settings.faq.title")}
                    <span className="text-xs text-gray-400 ml-2">
                      {t("settings.faq.count", {
                        n: arSettings.faqPatterns.length,
                      })}
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
                  {t("settings.faq.add")}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t("settings.faq.howto")}
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
                  {t("settings.ng.title")}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t("settings.ng.howto")}
              </p>
              <NgKeywordEditor
                keywords={arSettings.ngKeywords}
                onChange={(keywords) =>
                  saveAutoReply({ ...arSettings, ngKeywords: keywords })
                }
              />
            </div>

            {/* Default Template */}
            <DefaultTemplateEditor
              value={arSettings.defaultTemplate}
              onSave={(v) => saveAutoReply({ ...arSettings, defaultTemplate: v })}
            />
          </>
        )}
        {!arSettings && (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t("settings.loading")}</p>
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
  const { t } = useI18n();
  const [local, setLocal] = useState(pattern);
  // 親値で local を上書きするのは「別 FAQ に切り替わった時(=id 変更)」だけにする。
  // pattern オブジェクト参照で同期すると、入力中の未確定テキストが上書きで消える。
  useEffect(() => setLocal(pattern), [pattern.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 有効/無効トグルは即時親に伝える(=local も同期)
  function toggleEnabled(enabled: boolean) {
    const next = { ...local, enabled };
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-start gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={local.enabled}
            onChange={(e) => toggleEnabled(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-gray-600 dark:text-gray-300">{t("settings.faq.enabled")}</span>
        </label>
        <input
          value={local.keyword}
          onChange={(e) => setLocal({ ...local, keyword: e.target.value })}
          onBlur={() => onChange(local)}
          placeholder={t("settings.faq.keyword")}
          className="flex-1 min-w-[150px] px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-xs"
        />
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 p-1"
          aria-label={t("settings.faq.deleteAria")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={local.reply}
        onChange={(e) => setLocal({ ...local, reply: e.target.value })}
        onBlur={() => onChange(local)}
        rows={2}
        placeholder={t("settings.faq.reply")}
        className="w-full mt-2 px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-xs"
      />
    </div>
  );
}

function DefaultTemplateEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const { t } = useI18n();
  // ローカルバッファ:onBlur で初めて親 state を更新する(=入力中に他操作が走って未確定文字列が保存されるのを防ぐ)
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Save className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {t("settings.default.title")}
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {t("settings.default.help")}
      </p>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) onSave(local);
        }}
        rows={3}
        placeholder={t("settings.default.placeholder")}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
  const { t } = useI18n();
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
            // Phase 3 Wave-F 修正:IME 変換確定の Enter を NG ワード追加にしない
            // (=日本語 IME 変換中の Enter で未確定文字を誤投入する事故防止)
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t("settings.ng.placeholder")}
          className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
        />
        <button
          onClick={add}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium"
        >
          {t("settings.ng.add")}
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
              aria-label={`${t("settings.faq.deleteAria")} ${k}`}
            >
              ×
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <span className="text-xs text-gray-400">{t("settings.ng.empty")}</span>
        )}
      </div>
    </div>
  );
}
