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

const KEY = "trendio-clone-locale";

const dict: Record<Locale, Record<string, string>> = {
  ja: {
    "nav.dashboard": "ダッシュボード",
    "nav.comments": "コメント",
    "nav.trends": "トレンドを発見する",
    "nav.aiContent": "AIコンテンツ",
    "nav.settings": "アカウント設定",
    "nav.logout": "ログアウト",

    "dashboard.title": "分析",
    "dashboard.lastUpdated": "最終更新日時:本日午前9時",
    "dashboard.period.7": "過去7日間",
    "dashboard.period.30": "過去30日間",
    "dashboard.period.90": "過去90日間",
    "dashboard.export": "輸出",
    "dashboard.instagram": "インスタグラム",
    "dashboard.tiktok": "TikTok",
    "dashboard.followerTrend": "Follower Trend",
    "dashboard.actionTrend": "行動傾向",
    "dashboard.actionTrend.sub": "過去8週間の要約",
    "dashboard.likes": "いいね!",
    "dashboard.comments": "コメント",
    "dashboard.saves": "セーブ",
    "dashboard.clicks": "サイトクリック数",
    "dashboard.gender.title": "フォロワーの性別(期間別)",
    "dashboard.gender.ratio": "フォロワーの男女比",
    "dashboard.region": "フォロワー領域",
    "dashboard.postTime": "掲載時間",
    "dashboard.whitepaper": "インサイトホワイトペーパー",
    "dashboard.generateReport": "レポートを生成する",

    "settings.title": "アカウント設定",
    "settings.language": "言語",
    "settings.companyInfo": "会社情報",
    "settings.snsConnections": "SNSアカウント接続",

    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.delete": "削除",
    "common.copy": "コピー",
    "common.copied": "コピーしました",
    "common.search": "検索",
    "common.reply": "返信",
    "common.archive": "アーカイブ",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.comments": "Comments",
    "nav.trends": "Discover Trends",
    "nav.aiContent": "AI Content",
    "nav.settings": "Account Settings",
    "nav.logout": "Logout",

    "dashboard.title": "Analytics",
    "dashboard.lastUpdated": "Last updated: Today 9 AM",
    "dashboard.period.7": "Last 7 days",
    "dashboard.period.30": "Last 30 days",
    "dashboard.period.90": "Last 90 days",
    "dashboard.export": "Export",
    "dashboard.instagram": "Instagram",
    "dashboard.tiktok": "TikTok",
    "dashboard.followerTrend": "Follower Trend",
    "dashboard.actionTrend": "Action Trend",
    "dashboard.actionTrend.sub": "Last 8 weeks summary",
    "dashboard.likes": "Likes",
    "dashboard.comments": "Comments",
    "dashboard.saves": "Saves",
    "dashboard.clicks": "Site Clicks",
    "dashboard.gender.title": "Followers by Gender (Period)",
    "dashboard.gender.ratio": "Gender Ratio",
    "dashboard.region": "Follower Regions",
    "dashboard.postTime": "Post Time",
    "dashboard.whitepaper": "Insight Whitepaper",
    "dashboard.generateReport": "Generate Report",

    "settings.title": "Account Settings",
    "settings.language": "Language",
    "settings.companyInfo": "Company Information",
    "settings.snsConnections": "SNS Account Connections",

    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.search": "Search",
    "common.reply": "Reply",
    "common.archive": "Archive",
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
