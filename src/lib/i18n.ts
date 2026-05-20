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

const KEY = "karteia-locale";

const dict: Record<Locale, Record<string, string>> = {
  ja: {
    // ナビゲーション(Karteia の主要4機能、共P-01 該当ラベル)
    "nav.dashboard": "顧客理解",
    "nav.comments": "無人受付",
    "nav.customers": "顧客カルテ",
    "nav.settings": "アカウント設定",
    "nav.logout": "ログアウト",
    "nav.openMenu": "メニューを開く",
    "nav.closeMenu": "メニューを閉じる",
    "nav.mobileNav": "モバイルナビゲーション",
    "nav.main": "主要ナビゲーション",

    // プロセスバー
    "process.title": "顧客対応・販売支援プロセス",
    "process.understand": "顧客理解",
    "process.unattended": "無人受付",
    "process.records": "顧客カルテ",
    "process.sales": "販売支援",
    "process.loop": "改善ループ",

    // 共通挨拶
    "greeting.welcome": "お疲れさまです、{name}さん ☕️",
    "greeting.welcomeNoName": "お疲れさまです ☕️",

    // ダッシュボード
    "dashboard.title": "顧客との接点を、データで支えます ✨",
    "dashboard.subtitle.withGrowth":
      "{period} の間に、顧客接点が {delta} 増加しています。いいペースで進んでいます 📈",
    "dashboard.subtitle.noData":
      "まだ顧客接点データがありません。Instagram 連携後に蓄積されます",
    "dashboard.lastUpdated": "最終更新:本日午前9時",
    "dashboard.period.7": "過去7日間",
    "dashboard.period.30": "過去30日間",
    "dashboard.period.90": "過去90日間",
    "dashboard.export": "エクスポート",
    "dashboard.instagram": "Instagram 顧客接点",
    "dashboard.instagram.sub": "SNS 経由で発生した顧客接点・属性分析",
    "dashboard.tiktok": "TikTok 顧客接点",
    "dashboard.tiktok.sub": "TikTok API 再申請中、採択後の追加対応予定",
    "dashboard.kpi.contacts": "顧客接触人数",
    "dashboard.kpi.profileViews": "プロフィール閲覧",
    "dashboard.kpi.impressions": "顧客への表示回数",
    "dashboard.kpi.reach": "累計接触範囲",
    "dashboard.followerTrend": "フォロワー推移",
    "dashboard.actionTrend": "顧客接点傾向",
    "dashboard.actionTrend.sub": "過去8週間の要約",
    "dashboard.likes": "いいね",
    "dashboard.comments": "コメント",
    "dashboard.saves": "保存",
    "dashboard.clicks": "サイトクリック数",
    "dashboard.gender.title": "顧客の性別構成(期間別)",
    "dashboard.gender.ratio": "顧客の男女比",
    "dashboard.gender.female": "女性",
    "dashboard.gender.male": "男性",
    "dashboard.gender.other": "その他",
    "dashboard.region": "顧客の地域分布",
    "dashboard.postTime": "顧客接点の発生時間帯",
    "dashboard.postTime.recommendation": "推奨対応時間帯",
    "dashboard.tiktok.connect.title": "TikTokアカウントを接続してください",
    "dashboard.tiktok.connect.desc":
      "アカウントを接続すると、TikTok経由の顧客接点・エンゲージメント分析を確認できます。",
    "dashboard.tiktok.connect.cta": "設定ページで接続する",
    "dashboard.whitepaper": "インサイトホワイトペーパー",
    "dashboard.whitepaper.sub":
      "AI が顧客理解のための要点をまとめたレポートを生成します",
    "dashboard.generateReport": "レポートを生成する",
    "dashboard.report.title": "顧客接点レポートを生成する",
    "dashboard.report.desc":
      "InstagramまたはTikTokを選択すると、AIが顧客理解レポートを自動生成します。",
    "dashboard.report.saved": "保存済み({n})",
    "dashboard.report.pdfSave": "PDFで保存",
    "dashboard.postTime.optimal": "⌚ 最適時刻:17:00",
    "dashboard.postTime.peak":
      "17:00 · 08:00 · 03:00 の顧客接点が最も多い",
    "dashboard.export.csv": "CSV(Excel互換)",
    "dashboard.followerDelta.new": "新規 +{n}人",
    "dashboard.followerDelta.up": "+{n}人({pct}%)",
    "dashboard.followerDelta.down": "-{n}人({pct}%)",
    "dashboard.followerDelta.nodata": "データなし",
    "dashboard.toast.csv": "CSVをダウンロードしました",
    "dashboard.toast.json": "JSONをダウンロードしました",
    "dashboard.toast.pdf": "PDFを生成しました",

    // コメント管理
    "comments.title": "今日もお客様の声に応えていきましょう ✨",
    "comments.subtitle.unread":
      "未対応のコメントが {n} 件あります。AI返信案でサクッと返してみませんか?",
    "comments.subtitle.allDone": "すべて対応済みです 🎉 今日もお疲れさまです",
    "comments.autoReplyMode": "自動応答モード",
    "comments.autoReplyOn": "ON",
    "comments.autoReplyOff": "OFF",
    "comments.autoReplyDesc":
      "ONにすると、設定した営業時間外・FAQ該当コメントにAIが無人で即時応答します(=共P-01 無人受付)。応答ルールは「アカウント設定 → 自動応答ルール設定」で編集できます。",
    "comments.businessHours": "営業時間",
    "comments.faqCount": "FAQ {n} 件",
    "comments.ngCount": "NGワード {n} 件",
    "comments.tab.list": "コメント一覧",
    "comments.tab.logs": "自動応答ログ",
    "comments.search": "本文・ユーザー名で検索...",
    "comments.sort.newest": "新しい順",
    "comments.sort.oldest": "古い順",
    "comments.sort.sentiment": "感情順",
    "comments.filter.all": "すべて",
    "comments.filter.today": "今日",
    "comments.filter.7": "過去7日",
    "comments.filter.30": "過去30日",
    "comments.aiReply": "AI返信案を生成",
    "comments.aiReply.generating": "生成中...",
    "comments.aiReply.regenerate": "AI返信案を再生成",
    "comments.manualReply": "手動返信",
    "comments.send": "返信を送信",
    "comments.archive": "アーカイブ",
    "comments.cancel": "キャンセル",
    "comments.placeholder": "返信を入力...",
    "comments.count": "{n} 件のコメント",
    "comments.empty": "該当するコメントはありません",
    "comments.sentiment.positive": "ポジティブ",
    "comments.sentiment.neutral": "中立",
    "comments.sentiment.negative": "ネガティブ",
    "comments.status.unread": "未対応",
    "comments.status.replied": "返信済み",
    "comments.status.archived": "アーカイブ",
    "comments.category.product_inquiry": "商品問い合わせ",
    "comments.category.business_hours": "営業時間",
    "comments.category.complaint": "クレーム",
    "comments.category.positive": "ポジティブ",
    "comments.category.other": "その他",
    "comments.logs.monthly": "今月の自動応答件数:{n} 件",
    "comments.logs.desc":
      "AIが無人で対応したコメントの履歴(=共P-01 対応漏れの可視化、5年間ログ保管)",
    "comments.logs.empty": "まだ自動応答のログがありません",
    "comments.logs.emptyDesc":
      "自動応答モードをONにすると、AIが応答したコメントがここに記録されます",
    "comments.logs.original": "元コメント",
    "comments.logs.aiReply": "AI返信",
    "comments.bulk.selected": "選択した {n} 件",
    "comments.bulk.archive": "一括アーカイブ",
    "comments.bulk.deselect": "選択解除",

    // 顧客カルテ
    "customers.title": "お客様一人ひとりとの関わりを大切に 💚",
    "customers.subtitle.withData":
      "現在 {total} 名のお客様情報を蓄積しています。新規対応待ち {newCount} 名、要フォロー {followUp} 名",
    "customers.subtitle.noData":
      "まだ顧客情報がありません。Instagram 連携後に自動で蓄積されます",
    "customers.stats.total": "登録顧客",
    "customers.stats.new": "新規(対応待ち)",
    "customers.stats.vip": "VIP顧客",
    "customers.stats.followUp": "要フォロー",
    "customers.search": "ハンドル名・表示名で検索...",
    "customers.status.all": "すべて",
    "customers.status.new": "新規",
    "customers.status.active": "対応中",
    "customers.status.vip": "VIP",
    "customers.status.follow_up": "要フォロー",
    "customers.status.closed": "対応済",
    "customers.tag.all": "全タグ",
    "customers.lastContact": "最終接点",
    "customers.totalInteractions": "累計接点",
    "customers.aiAnalysis": "AI 顧客好み分析",
    "customers.empty": "該当するお客様はいません",
    "customers.filterStatus": "対応ステータス",
    "customers.filterTag": "タグ",
    "customers.count": "{n} 名のお客様",
    "customers.loading": "(読み込み中...)",
    "customers.tag.VIP": "VIP",
    "customers.tag.既存顧客": "既存顧客",
    "customers.tag.問い合わせ多": "問い合わせ多",
    "customers.tag.新規": "新規",
    "customers.tag.リピーター": "リピーター",
    "customers.tag.クレーム経験": "クレーム経験",

    // 顧客詳細
    "customerDetail.back": "顧客一覧に戻る",
    "customerDetail.aiAnalysis.title": "AI 顧客好み分析",
    "customerDetail.aiAnalysis.run": "AI 分析を実行",
    "customerDetail.aiAnalysis.running": "分析中...",
    "customerDetail.interactions": "接点履歴",
    "customerDetail.category": "カテゴリ集計",
    "customerDetail.notFound": "顧客が見つかりません",
    "customerDetail.notes": "メモ",
    "customerDetail.stat.firstContact": "初回接点",
    "customerDetail.stat.attribute": "属性",
    "customerDetail.aiAnalysis.cached": "キャッシュ",
    "customerDetail.aiAnalysis.rerun": "再分析",
    "customerDetail.aiAnalysis.desc":
      "顧客の過去の接点履歴から、関心領域・対応の注意点・推奨対応をAIが要約します。1顧客につき1日1回まで実行できます。",
    "customerDetail.analysis.interests": "関心領域",
    "customerDetail.analysis.cautions": "対応の注意点",
    "customerDetail.analysis.summary": "推奨対応サマリ",
    "customerDetail.analysis.empty": "まだAI分析を実行していません",
    "customerDetail.analysis.runAt": "分析実行:{at}",
    "customerDetail.analysis.notRun": "まだ分析を実行していません。「AI分析を実行」ボタンを押してください。",
    "customerDetail.category.title": "問い合わせカテゴリ別 集計",
    "customerDetail.interactions.title": "接点履歴(時系列)",
    "customerDetail.interactions.count": "{n} 件",
    "customerDetail.interactions.empty": "接点履歴がありません",

    // 設定
    "settings.title": "アカウント設定",
    "settings.subtitle": "SNSアカウントの接続、表示、自動応答ルールを管理する",
    "settings.theme": "テーマ",
    "settings.theme.appearance": "外観モード",
    "settings.theme.appearance.sub":
      "ライト・ダーク・システム設定から選択",
    "settings.theme.light": "ライト",
    "settings.theme.dark": "ダーク",
    "settings.theme.system": "システム",
    "settings.language": "言語",
    "settings.language.display": "表示言語",
    "settings.language.sub": "アプリの表示言語を選択してください",
    "settings.company": "会社情報",
    "settings.snsConnections": "SNSアカウント接続",
    "settings.sns.instagram.desc":
      "Meta 公式 Graph API 経由で Instagram ビジネスアカウントを連携",
    "settings.sns.tiktok.desc": "TikTok API 再申請中、採択後の追加対応予定",
    "settings.sns.tips": "接続のヒント",
    "settings.autoReplyRules": "自動応答ルール設定",
    "settings.language.ja": "日本語",
    "settings.language.en": "English",
    "settings.company.placeholder": "株式会社○○",
    "settings.company.unset": "未設定",
    "settings.company.editAria": "会社情報を編集",
    "settings.company.name": "会社・組織名",
    "settings.company.help": "サイドバーに表示される名前です",
    "settings.loading": "設定を読み込み中...",
    "settings.businessHours.title": "営業時間",
    "settings.businessHours.enable": "営業時間判定を有効化",
    "settings.businessHours.startAria": "営業開始時刻",
    "settings.businessHours.endAria": "営業終了時刻",
    "settings.faq.title": "FAQパターン",
    "settings.faq.enabled": "有効",
    "settings.faq.keyword": "キーワード(例:営業時間)",
    "settings.faq.reply": "定型応答文",
    "settings.faq.deleteAria": "削除",
    "settings.faq.add": "FAQを追加",
    "settings.default.title": "デフォルト応答テンプレ",
    "settings.default.placeholder":
      "例:お問い合わせありがとうございます。担当者より順次お返事いたします。",
    "settings.default.help":
      "営業時間外で FAQ にマッチしないコメントに、このテンプレートで応答します。",
    "settings.ng.title": "NGワード",
    "settings.ng.placeholder": "NGワードを入力 (Enterで追加)",
    "settings.ng.empty": "NGワードはありません",
    "settings.ng.add": "追加",
    "settings.sync.started": "同期を開始しました",

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
    "common.error": "エラーが発生しました",

    // ログイン画面
    "login.greeting": "お疲れさまです。アカウントにログインしてください ☕️",
    "login.email": "メールアドレス",
    "login.password": "パスワード",
    "login.emailPlaceholder": "you@company.com",
    "login.passwordPlaceholder": "パスワードを入力",
    "login.rememberMe": "ログイン状態を維持",
    "login.forgot": "パスワードをお忘れですか?",
    "login.terms": "利用規約",
    "login.privacy": "プライバシーポリシー",
    "login.agreeMid": " と ",
    "login.agreeEnd": " に同意します",
    "login.submit": "ログイン",
    "login.submitting": "ログイン中...",
    "login.adminIssued": "アカウントは管理者から発行されます",
    "login.err.required": "メールアドレスとパスワードを入力してください",
    "login.err.agree": "利用規約とプライバシーポリシーに同意してください",
    "login.err.failed": "ログインに失敗しました",
    "footer.privacy": "プライバシーポリシー",
    "footer.terms": "利用規約",
    "footer.support": "サポート",
  },
  en: {
    // Navigation
    "nav.dashboard": "Customer Understanding",
    "nav.comments": "Unattended Reception",
    "nav.customers": "Customer Records",
    "nav.settings": "Account Settings",
    "nav.logout": "Logout",
    "nav.openMenu": "Open menu",
    "nav.closeMenu": "Close menu",
    "nav.mobileNav": "Mobile navigation",
    "nav.main": "Main navigation",

    // Process Bar
    "process.title": "Customer Engagement & Sales Process",
    "process.understand": "Understand",
    "process.unattended": "Unattended Reception",
    "process.records": "Customer Records",
    "process.sales": "Sales Support",
    "process.loop": "Improvement Loop",

    // Greetings
    "greeting.welcome": "Welcome back, {name} ☕️",
    "greeting.welcomeNoName": "Welcome back ☕️",

    // Dashboard
    "dashboard.title": "Data-driven customer engagement ✨",
    "dashboard.subtitle.withGrowth":
      "Over {period}, customer interactions grew by {delta}. Great pace! 📈",
    "dashboard.subtitle.noData":
      "No customer interaction data yet. Data will accumulate after connecting Instagram.",
    "dashboard.lastUpdated": "Last updated: Today 9 AM",
    "dashboard.period.7": "Last 7 days",
    "dashboard.period.30": "Last 30 days",
    "dashboard.period.90": "Last 90 days",
    "dashboard.export": "Export",
    "dashboard.instagram": "Instagram Engagement",
    "dashboard.instagram.sub":
      "Customer interactions and audience demographics from your Instagram",
    "dashboard.tiktok": "TikTok Engagement",
    "dashboard.tiktok.sub":
      "TikTok API integration pending review; activates after approval",
    "dashboard.kpi.contacts": "Customers Reached",
    "dashboard.kpi.profileViews": "Profile Views",
    "dashboard.kpi.impressions": "Impressions",
    "dashboard.kpi.reach": "Total Reach",
    "dashboard.followerTrend": "Follower Trend",
    "dashboard.actionTrend": "Interaction Trend",
    "dashboard.actionTrend.sub": "8-week summary",
    "dashboard.likes": "Likes",
    "dashboard.comments": "Comments",
    "dashboard.saves": "Saves",
    "dashboard.clicks": "Site Clicks",
    "dashboard.gender.title": "Customer Gender by Period",
    "dashboard.gender.ratio": "Gender Ratio",
    "dashboard.gender.female": "Female",
    "dashboard.gender.male": "Male",
    "dashboard.gender.other": "Other",
    "dashboard.region": "Customer Regions",
    "dashboard.postTime": "Interaction Hour of Day",
    "dashboard.postTime.recommendation": "Recommended response hours",
    "dashboard.tiktok.connect.title": "Connect your TikTok account",
    "dashboard.tiktok.connect.desc":
      "Connecting your TikTok account enables interaction and engagement analytics on this dashboard.",
    "dashboard.tiktok.connect.cta": "Connect from Settings",
    "dashboard.whitepaper": "Insight Whitepaper",
    "dashboard.whitepaper.sub":
      "AI-generated summary report for deeper customer understanding",
    "dashboard.generateReport": "Generate Report",
    "dashboard.report.title": "Generate a customer interaction report",
    "dashboard.report.desc":
      "Select Instagram or TikTok and the AI will draft a customer understanding report.",
    "dashboard.report.saved": "Saved ({n})",
    "dashboard.report.pdfSave": "Save as PDF",
    "dashboard.postTime.optimal": "⌚ Best time: 17:00",
    "dashboard.postTime.peak":
      "Peak interactions at 17:00, 08:00, 03:00",
    "dashboard.export.csv": "CSV (Excel-compatible)",
    "dashboard.followerDelta.new": "+{n} new",
    "dashboard.followerDelta.up": "+{n} ({pct}%)",
    "dashboard.followerDelta.down": "-{n} ({pct}%)",
    "dashboard.followerDelta.nodata": "no data",
    "dashboard.toast.csv": "CSV downloaded",
    "dashboard.toast.json": "JSON downloaded",
    "dashboard.toast.pdf": "PDF generated",

    // Comments
    "comments.title": "Let's respond to every customer voice today ✨",
    "comments.subtitle.unread":
      "You have {n} unread comments. Try drafting replies with AI in one click.",
    "comments.subtitle.allDone": "Everything is handled today 🎉 Great work!",
    "comments.autoReplyMode": "Auto-Reply Mode",
    "comments.autoReplyOn": "ON",
    "comments.autoReplyOff": "OFF",
    "comments.autoReplyDesc":
      "When ON, AI instantly responds to out-of-hours or FAQ-matching comments (Unattended Reception). Configure rules in Account Settings → Auto-Reply Rule Settings.",
    "comments.businessHours": "Business hours",
    "comments.faqCount": "FAQ: {n}",
    "comments.ngCount": "Blocked keywords: {n}",
    "comments.tab.list": "Comments",
    "comments.tab.logs": "Auto-Reply Logs",
    "comments.search": "Search by text or username...",
    "comments.sort.newest": "Newest",
    "comments.sort.oldest": "Oldest",
    "comments.sort.sentiment": "By sentiment",
    "comments.filter.all": "All",
    "comments.filter.today": "Today",
    "comments.filter.7": "Last 7 days",
    "comments.filter.30": "Last 30 days",
    "comments.aiReply": "Generate AI Reply",
    "comments.aiReply.generating": "Generating...",
    "comments.aiReply.regenerate": "Regenerate AI Reply",
    "comments.manualReply": "Manual Reply",
    "comments.send": "Send Reply",
    "comments.archive": "Archive",
    "comments.cancel": "Cancel",
    "comments.placeholder": "Type your reply...",
    "comments.count": "{n} comments",
    "comments.empty": "No matching comments",
    "comments.sentiment.positive": "Positive",
    "comments.sentiment.neutral": "Neutral",
    "comments.sentiment.negative": "Negative",
    "comments.status.unread": "Unread",
    "comments.status.replied": "Replied",
    "comments.status.archived": "Archived",
    "comments.category.product_inquiry": "Product Inquiry",
    "comments.category.business_hours": "Business Hours",
    "comments.category.complaint": "Complaint",
    "comments.category.positive": "Positive",
    "comments.category.other": "Other",
    "comments.logs.monthly": "Auto-replies this month: {n}",
    "comments.logs.desc":
      "History of AI-handled comments (Common P-01 audit, 5-year retention)",
    "comments.logs.empty": "No auto-reply logs yet",
    "comments.logs.emptyDesc":
      "Turn Auto-Reply Mode ON to start logging AI responses here",
    "comments.logs.original": "Original Comment",
    "comments.logs.aiReply": "AI Reply",
    "comments.bulk.selected": "{n} selected",
    "comments.bulk.archive": "Archive selected",
    "comments.bulk.deselect": "Deselect",

    // Customers
    "customers.title": "Care for every customer relationship 💚",
    "customers.subtitle.withData":
      "Currently managing {total} customer records. {newCount} awaiting first response, {followUp} need follow-up.",
    "customers.subtitle.noData":
      "No customer records yet. They will auto-populate after Instagram connection.",
    "customers.stats.total": "Total Customers",
    "customers.stats.new": "New (Pending)",
    "customers.stats.vip": "VIP Customers",
    "customers.stats.followUp": "Need Follow-up",
    "customers.search": "Search by handle or display name...",
    "customers.status.all": "All",
    "customers.status.new": "New",
    "customers.status.active": "Active",
    "customers.status.vip": "VIP",
    "customers.status.follow_up": "Follow-up",
    "customers.status.closed": "Closed",
    "customers.tag.all": "All tags",
    "customers.lastContact": "Last contact",
    "customers.totalInteractions": "Total interactions",
    "customers.aiAnalysis": "AI Customer Preference Analysis",
    "customers.empty": "No matching customers",
    "customers.filterStatus": "Status",
    "customers.filterTag": "Tag",
    "customers.count": "{n} customers",
    "customers.loading": "(loading...)",
    "customers.tag.VIP": "VIP",
    "customers.tag.既存顧客": "Existing",
    "customers.tag.問い合わせ多": "Frequent Inquiry",
    "customers.tag.新規": "New",
    "customers.tag.リピーター": "Repeat",
    "customers.tag.クレーム経験": "Complaint History",

    // Customer Detail
    "customerDetail.back": "Back to customers",
    "customerDetail.aiAnalysis.title": "AI Customer Preference Analysis",
    "customerDetail.aiAnalysis.run": "Run AI Analysis",
    "customerDetail.aiAnalysis.running": "Analyzing...",
    "customerDetail.interactions": "Interaction History",
    "customerDetail.category": "By Category",
    "customerDetail.notFound": "Customer not found",
    "customerDetail.notes": "Note",
    "customerDetail.stat.firstContact": "First contact",
    "customerDetail.stat.attribute": "Demographics",
    "customerDetail.aiAnalysis.cached": "Cached",
    "customerDetail.aiAnalysis.rerun": "Re-analyze",
    "customerDetail.aiAnalysis.desc":
      "AI summarizes interests, cautions, and recommended approach from the customer's interaction history. Once per customer per day.",
    "customerDetail.analysis.interests": "Interests",
    "customerDetail.analysis.cautions": "Cautions",
    "customerDetail.analysis.summary": "Recommended Approach",
    "customerDetail.analysis.empty": "AI analysis hasn't been run yet",
    "customerDetail.analysis.runAt": "Analyzed at: {at}",
    "customerDetail.analysis.notRun":
      "AI analysis hasn't been run yet. Click the \"Run AI Analysis\" button.",
    "customerDetail.category.title": "Inquiries by Category",
    "customerDetail.interactions.title": "Interaction History (Timeline)",
    "customerDetail.interactions.count": "{n}",
    "customerDetail.interactions.empty": "No interaction history",

    // Settings
    "settings.title": "Account Settings",
    "settings.subtitle":
      "Manage SNS account connections, display, and auto-reply rules",
    "settings.theme": "Theme",
    "settings.theme.appearance": "Appearance",
    "settings.theme.appearance.sub": "Choose light, dark, or system",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.language": "Language",
    "settings.language.display": "Display Language",
    "settings.language.sub": "Select the display language for the app",
    "settings.company": "Company Information",
    "settings.snsConnections": "SNS Account Connections",
    "settings.sns.instagram.desc":
      "Connect your Instagram Business Account via Meta Graph API",
    "settings.sns.tiktok.desc":
      "TikTok API integration pending; activates after approval",
    "settings.sns.tips": "Connection Tips",
    "settings.autoReplyRules": "Auto-Reply Rule Settings",
    "settings.language.ja": "Japanese",
    "settings.language.en": "English",
    "settings.company.placeholder": "Your company name",
    "settings.company.unset": "Not set",
    "settings.company.editAria": "Edit company info",
    "settings.company.name": "Company / Organization name",
    "settings.company.help": "Displayed in the sidebar",
    "settings.loading": "Loading settings...",
    "settings.businessHours.title": "Business hours",
    "settings.businessHours.enable": "Enable business hours check",
    "settings.businessHours.startAria": "Business hours start",
    "settings.businessHours.endAria": "Business hours end",
    "settings.faq.title": "FAQ Patterns",
    "settings.faq.enabled": "Enabled",
    "settings.faq.keyword": "Keyword (e.g., business hours)",
    "settings.faq.reply": "Reply template",
    "settings.faq.deleteAria": "Delete",
    "settings.faq.add": "Add FAQ",
    "settings.default.title": "Default reply template",
    "settings.default.placeholder":
      "e.g., Thank you for your inquiry. Our team will respond shortly.",
    "settings.default.help":
      "Used to respond to out-of-hours comments that don't match any FAQ.",
    "settings.ng.title": "Blocked Keywords",
    "settings.ng.placeholder": "Enter blocked keyword (Enter to add)",
    "settings.ng.empty": "No blocked keywords",
    "settings.ng.add": "Add",
    "settings.sync.started": "Sync started",

    // Common
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
    "common.error": "An error occurred",

    // Login
    "login.greeting": "Welcome — please sign in to your account ☕️",
    "login.email": "Email",
    "login.password": "Password",
    "login.emailPlaceholder": "you@company.com",
    "login.passwordPlaceholder": "Enter your password",
    "login.rememberMe": "Keep me signed in",
    "login.forgot": "Forgot password?",
    "login.terms": "Terms of Service",
    "login.privacy": "Privacy Policy",
    "login.agreeMid": " and ",
    "login.agreeEnd": "",
    "login.submit": "Sign in",
    "login.submitting": "Signing in...",
    "login.adminIssued": "Accounts are issued by the administrator",
    "login.err.required": "Please enter your email and password",
    "login.err.agree": "Please accept the Terms of Service and Privacy Policy",
    "login.err.failed": "Sign-in failed",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms",
    "footer.support": "Support",
  },
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

/**
 * 単純なテンプレ置換({name} → vars.name)。
 * 値が無い場合はプレースホルダのまま残す(=本番でバグに気付ける)。
 */
function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

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
    (key: string, vars?: Record<string, string | number>) => {
      const template = dict[locale][key] ?? key;
      return format(template, vars);
    },
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
