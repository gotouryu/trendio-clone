"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "ja" | "en";

const KEY = "customercare-ai-locale";

const dict: Record<Locale, Record<string, string>> = {
  ja: {
    // ナビゲーション
    "nav.dashboard": "ダッシュボード",
    "nav.comments": "コメント管理",
    "nav.customers": "顧客カルテ",
    "nav.settings": "アカウント設定",
    "nav.logout": "ログアウト",

    // ダッシュボード(=機能③ 顧客接点分析)
    "dashboard.title": "ダッシュボード",
    "dashboard.subtitle": "★共P-01 該当機能 — 顧客理解・属性分析★",
    "dashboard.lastUpdated": "最終更新:本日午前9時",
    "dashboard.period.7": "過去7日間",
    "dashboard.period.30": "過去30日間",
    "dashboard.period.90": "過去90日間",
    "dashboard.export": "エクスポート",
    "dashboard.instagram": "Instagram",
    "dashboard.tiktok": "TikTok",
    "dashboard.followerTrend": "フォロワー推移",
    "dashboard.actionTrend": "顧客接点傾向",
    "dashboard.actionTrend.sub": "過去8週間の要約",
    "dashboard.likes": "いいね",
    "dashboard.comments": "コメント",
    "dashboard.saves": "保存",
    "dashboard.clicks": "サイトクリック数",
    "dashboard.gender.title": "顧客の性別構成(期間別)",
    "dashboard.gender.ratio": "顧客の男女比",
    "dashboard.region": "顧客の地域分布",
    "dashboard.postTime": "顧客接点の発生時間帯",
    "dashboard.whitepaper": "インサイトホワイトペーパー",
    "dashboard.generateReport": "レポートを生成する",

    // コメント管理(=機能① AI顧客応答機能)
    "comments.title": "コメント管理",
    "comments.subtitle": "★共P-01 該当機能 — 無人受付★",
    "comments.aiReply": "AI返信案を生成",
    "comments.autoReplyMode": "自動応答モード",
    "comments.autoReplyOn": "ON",
    "comments.autoReplyOff": "OFF",
    "comments.tab.list": "コメント一覧",
    "comments.tab.logs": "自動応答ログ",

    // 顧客カルテ(=機能② 顧客行動履歴・CRM)
    "customers.title": "顧客カルテ",
    "customers.subtitle": "★共P-01 該当機能 — 顧客行動履歴・CRM★",
    "customers.filterStatus": "対応ステータス",
    "customers.filterTag": "タグ",
    "customers.search": "ハンドル名で検索",
    "customers.lastContact": "最終接点日",
    "customers.totalInteractions": "累計接点数",
    "customers.aiAnalysis": "AI 顧客好み分析",

    // 設定
    "settings.title": "アカウント設定",
    "settings.language": "言語",
    "settings.theme": "テーマ",
    "settings.companyInfo": "会社情報",
    "settings.snsConnections": "SNSアカウント接続",
    "settings.autoReplyRules": "自動応答ルール設定",

    // 共通
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.delete": "削除",
    "common.copy": "コピー",
    "common.copied": "コピーしました",
    "common.search": "検索",
    "common.reply": "返信",
    "common.archive": "アーカイブ",
    "common.edit": "編集",
    "common.connected": "接続済み",
    "common.connect": "接続",
    "common.disconnect": "接続解除",
    "common.sync": "同期",
    "common.loading": "読み込み中...",
    "common.noData": "データがありません",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.comments": "Comments",
    "nav.customers": "Customer Records",
    "nav.settings": "Account Settings",
    "nav.logout": "Logout",

    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Customer Understanding & Attribute Analysis",
    "dashboard.lastUpdated": "Last updated: Today 9 AM",
    "dashboard.period.7": "Last 7 days",
    "dashboard.period.30": "Last 30 days",
    "dashboard.period.90": "Last 90 days",
    "dashboard.export": "Export",
    "dashboard.instagram": "Instagram",
    "dashboard.tiktok": "TikTok",
    "dashboard.followerTrend": "Follower Trend",
    "dashboard.actionTrend": "Interaction Trend",
    "dashboard.actionTrend.sub": "Last 8 weeks summary",
    "dashboard.likes": "Likes",
    "dashboard.comments": "Comments",
    "dashboard.saves": "Saves",
    "dashboard.clicks": "Site Clicks",
    "dashboard.gender.title": "Customer Gender by Period",
    "dashboard.gender.ratio": "Gender Ratio",
    "dashboard.region": "Customer Regions",
    "dashboard.postTime": "Interaction Time of Day",
    "dashboard.whitepaper": "Insight Whitepaper",
    "dashboard.generateReport": "Generate Report",

    "comments.title": "Comment Management",
    "comments.subtitle": "Unattended Customer Response (CommonP-01)",
    "comments.aiReply": "Generate AI Reply",
    "comments.autoReplyMode": "Auto-Reply Mode",
    "comments.autoReplyOn": "ON",
    "comments.autoReplyOff": "OFF",
    "comments.tab.list": "Comments",
    "comments.tab.logs": "Auto-Reply Logs",

    "customers.title": "Customer Records",
    "customers.subtitle": "Customer Action History & CRM (CommonP-01)",
    "customers.filterStatus": "Status",
    "customers.filterTag": "Tags",
    "customers.search": "Search by handle",
    "customers.lastContact": "Last Contact",
    "customers.totalInteractions": "Total Interactions",
    "customers.aiAnalysis": "AI Customer Preference Analysis",

    "settings.title": "Account Settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.companyInfo": "Company Information",
    "settings.snsConnections": "SNS Account Connections",
    "settings.autoReplyRules": "Auto-Reply Rule Settings",

    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.search": "Search",
    "common.reply": "Reply",
    "common.archive": "Archive",
    "common.edit": "Edit",
    "common.connected": "Connected",
    "common.connect": "Connect",
    "common.disconnect": "Disconnect",
    "common.sync": "Sync",
    "common.loading": "Loading...",
    "common.noData": "No data",
  },
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY) as Locale | null;
      if (stored === "ja" || stored === "en") setLocaleState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string) => dict[locale][key] ?? key,
    [locale],
  );

  return createElement(
    I18nCtx.Provider,
    { value: { locale, setLocale, t } },
    children,
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
