import type {
  DashboardKPI,
  FollowerTrendPoint,
  ActionTrendPoint,
  GenderRatio,
  GenderByPeriod,
  RegionItem,
  HourlyEngagement,
  CommentItem,
  ContentIdea,
  Customer,
  CustomerInteraction,
  AutoReplySettings,
  AutoReplyLog,
  FaqPattern,
} from "./types";

// ============================================================
// Dashboard KPI (=共P-01 顧客理解・属性分析 用、Instagram未接続時のデモ値)
// 実運用想定:中小企業のSNSフォロワー数百〜千、性別比はFemale/Male/Other = 50/40/10 程度
// ============================================================
export const mockKPI: DashboardKPI = {
  followers: 487,
  profileViews: 1240,
  totalImpressions: 8920,
  totalReach: 5430,
};

export const mockFollowerTrend: FollowerTrendPoint[] = Array.from(
  { length: 12 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i));
    // 487から12週前の460まで緩やかに増加
    const base = 460 + Math.floor((i / 11) * 27);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      followers: base,
    };
  },
);

export const mockActionTrend: ActionTrendPoint[] = [
  { date: "4/22", likes: 28, comments: 4, saves: 3, clicks: 12 },
  { date: "4/25", likes: 22, comments: 3, saves: 2, clicks: 9 },
  { date: "4/28", likes: 35, comments: 5, saves: 4, clicks: 14 },
  { date: "5/01", likes: 19, comments: 2, saves: 1, clicks: 7 },
  { date: "5/04", likes: 41, comments: 7, saves: 6, clicks: 18 },
  { date: "5/07", likes: 33, comments: 5, saves: 3, clicks: 13 },
  { date: "5/10", likes: 27, comments: 4, saves: 2, clicks: 11 },
  { date: "5/13", likes: 38, comments: 6, saves: 5, clicks: 16 },
  { date: "5/16", likes: 24, comments: 3, saves: 2, clicks: 10 },
  { date: "5/18", likes: 31, comments: 4, saves: 3, clicks: 12 },
  { date: "5/19", likes: 36, comments: 5, saves: 4, clicks: 15 },
];

// 実運用想定の性別比(Female 52% / Male 41% / Other 7%)
export const mockGenderRatio: GenderRatio = {
  female: 52,
  male: 41,
  other: 7,
};

export const mockGenderByPeriod: GenderByPeriod[] = [
  { ageGroup: "13-17", male: 35, female: 60, other: 5 },
  { ageGroup: "18-24", male: 38, female: 56, other: 6 },
  { ageGroup: "25-34", male: 42, female: 51, other: 7 },
  { ageGroup: "35+", male: 45, female: 47, other: 8 },
];

export const mockRegions: RegionItem[] = [
  { name: "東京都", percentage: 28.5, count: 139 },
  { name: "大阪府", percentage: 17.3, count: 84 },
  { name: "神奈川県", percentage: 11.2, count: 55 },
  { name: "愛知県", percentage: 8.6, count: 42 },
  { name: "京都府", percentage: 6.4, count: 31 },
  { name: "兵庫県", percentage: 5.5, count: 27 },
  { name: "福岡県", percentage: 4.9, count: 24 },
  { name: "北海道", percentage: 4.3, count: 21 },
];

export const mockHourlyEngagement: HourlyEngagement[] = Array.from(
  { length: 24 },
  (_, h) => {
    const base =
      h === 8 ? 33 : h === 17 ? 34 : h === 3 ? 30 : Math.floor(Math.random() * 8);
    return { hour: h, engagement: base };
  },
);

// ============================================================
// Comments(=機能① AI顧客応答機能 のデモデータ)
// ============================================================
export const mockComments: CommentItem[] = [
  {
    id: "c1",
    postId: "p1",
    postThumbnail: "/avatars/post-1.svg",
    author: "yamada_taro",
    authorAvatar: "/avatars/user-1.svg",
    text: "とても素敵な投稿ですね!参考になります🥰",
    timestamp: "2026-05-19T10:23:00+09:00",
    status: "unread",
    sentiment: "positive",
    category: "positive",
  },
  {
    id: "c2",
    postId: "p2",
    postThumbnail: "/avatars/post-2.svg",
    author: "sakura_jp",
    authorAvatar: "/avatars/user-2.svg",
    text: "次の入荷はいつ頃ですか?",
    timestamp: "2026-05-19T09:11:00+09:00",
    status: "unread",
    sentiment: "neutral",
    category: "product_inquiry",
  },
  {
    id: "c3",
    postId: "p3",
    postThumbnail: "/avatars/post-3.svg",
    author: "marketing_pro",
    authorAvatar: "/avatars/user-3.svg",
    text: "この商品の使い方を詳しく教えてください!",
    timestamp: "2026-05-18T18:45:00+09:00",
    status: "replied",
    sentiment: "positive",
    category: "product_inquiry",
  },
  {
    id: "c4",
    postId: "p1",
    postThumbnail: "/avatars/post-1.svg",
    author: "kosuke_design",
    authorAvatar: "/avatars/user-1.svg",
    text: "営業時間を教えていただけますか?",
    timestamp: "2026-05-18T14:21:00+09:00",
    status: "unread",
    sentiment: "neutral",
    category: "business_hours",
  },
  {
    id: "c5",
    postId: "p2",
    postThumbnail: "/avatars/post-2.svg",
    author: "minori_lab",
    authorAvatar: "/avatars/user-2.svg",
    text: "前回購入した商品の梱包に問題がありました",
    timestamp: "2026-05-17T11:30:00+09:00",
    status: "unread",
    sentiment: "negative",
    category: "complaint",
  },
];

// ============================================================
// AI Content (=機能④ 接客コンテンツ生成、申請外だが残置)
// ============================================================
export const mockContentIdeas: ContentIdea[] = [
  {
    id: "ci1",
    title: "営業時間案内のFAQ応答テンプレ",
    hook: "「営業時間を教えてください」への即時返信案",
    script:
      "1. 挨拶 + 質問への感謝\n2. 営業時間の明示(平日/休日)\n3. 問い合わせ窓口の案内",
    hashtags: ["FAQ", "営業時間", "顧客対応"],
    platform: "instagram",
    savedAt: "2026-05-15",
  },
  {
    id: "ci2",
    title: "新規顧客向け 商品問い合わせ応答スクリプト",
    hook: "新規のお客様からの「商品の使い方」質問用",
    script:
      "Q: 使い方は?\nA: ◯◯のように使うと一番効果的です。\nQ: お手入れ方法は?\nA: …",
    hashtags: ["接客スクリプト", "新規顧客", "商品問い合わせ"],
    platform: "instagram",
    savedAt: "2026-05-12",
  },
];

export const industryOptions: { value: string; label: string }[] = [
  { value: "food-beverage", label: "飲食" },
  { value: "fashion", label: "ファッション" },
  { value: "beauty", label: "美容" },
  { value: "fitness", label: "フィットネス" },
  { value: "tech", label: "テック" },
  { value: "travel", label: "旅行" },
  { value: "education", label: "教育" },
  { value: "real-estate", label: "不動産" },
];

export const goalOptions: { value: string; label: string }[] = [
  { value: "brand-awareness", label: "ブランド認知を高める" },
  { value: "engagement", label: "エンゲージメント向上" },
  { value: "sales-conversion", label: "売上・コンバージョン" },
  { value: "follower-growth", label: "フォロワー獲得" },
  { value: "lead-generation", label: "リード獲得" },
];

// ============================================================
// Customers — 顧客カルテのデモデータ(機能② 共P-01 顧客行動履歴・CRM)
// ============================================================
export const mockCustomers: Customer[] = [
  {
    id: "cu1",
    instagramHandle: "yamada_taro",
    displayName: "山田 太郎",
    profileImageUrl: "/avatars/user-1.svg",
    firstContactAt: "2026-03-12T10:00:00+09:00",
    lastContactAt: "2026-05-19T10:23:00+09:00",
    totalInteractions: 8,
    tags: ["VIP", "リピーター"],
    status: "vip",
    autoReplyEnabled: true,
    ageRange: "25-34",
    gender: "male",
    region: "東京都",
    notes: "新商品ローンチ時に積極的にコメントしてくれる優良顧客",
  },
  {
    id: "cu2",
    instagramHandle: "sakura_jp",
    displayName: "佐藤 さくら",
    profileImageUrl: "/avatars/user-2.svg",
    firstContactAt: "2026-04-08T15:30:00+09:00",
    lastContactAt: "2026-05-19T09:11:00+09:00",
    totalInteractions: 5,
    tags: ["既存顧客", "問い合わせ多"],
    status: "active",
    autoReplyEnabled: true,
    ageRange: "18-24",
    gender: "female",
    region: "大阪府",
  },
  {
    id: "cu3",
    instagramHandle: "marketing_pro",
    displayName: "中村 由香",
    profileImageUrl: "/avatars/user-3.svg",
    firstContactAt: "2026-05-01T12:00:00+09:00",
    lastContactAt: "2026-05-18T18:45:00+09:00",
    totalInteractions: 3,
    tags: ["新規"],
    status: "follow_up",
    autoReplyEnabled: true,
    ageRange: "25-34",
    gender: "female",
    region: "神奈川県",
  },
  {
    id: "cu4",
    instagramHandle: "kosuke_design",
    displayName: "小林 浩介",
    profileImageUrl: "/avatars/user-1.svg",
    firstContactAt: "2026-05-18T14:21:00+09:00",
    lastContactAt: "2026-05-18T14:21:00+09:00",
    totalInteractions: 1,
    tags: ["新規"],
    status: "new",
    autoReplyEnabled: true,
    ageRange: "35-44",
    gender: "male",
    region: "京都府",
  },
  {
    id: "cu5",
    instagramHandle: "minori_lab",
    displayName: "本田 みのり",
    profileImageUrl: "/avatars/user-2.svg",
    firstContactAt: "2026-04-25T09:00:00+09:00",
    lastContactAt: "2026-05-17T11:30:00+09:00",
    totalInteractions: 4,
    tags: ["クレーム経験"],
    status: "follow_up",
    autoReplyEnabled: false,
    ageRange: "25-34",
    gender: "female",
    region: "愛知県",
    notes: "梱包品質クレーム対応中。手動応答に切替。",
  },
];

// 各顧客の接点履歴(時系列)
export const mockInteractions: CustomerInteraction[] = [
  // 山田さん(VIP)
  {
    id: "in1",
    customerId: "cu1",
    type: "comment",
    content: "とても素敵な投稿ですね!参考になります🥰",
    category: "positive",
    createdAt: "2026-05-19T10:23:00+09:00",
    status: "unread",
  },
  {
    id: "in2",
    customerId: "cu1",
    type: "comment",
    content: "毎回素敵な投稿ありがとうございます!",
    category: "positive",
    createdAt: "2026-05-10T15:21:00+09:00",
    status: "replied",
  },
  {
    id: "in3",
    customerId: "cu1",
    type: "reply_manual",
    content: "ありがとうございます!引き続きよろしくお願いします。",
    createdAt: "2026-05-10T16:00:00+09:00",
    handledBy: "human",
  },
  {
    id: "in4",
    customerId: "cu1",
    type: "comment",
    content: "新商品いつでますか?楽しみにしてます!",
    category: "product_inquiry",
    createdAt: "2026-04-28T11:00:00+09:00",
    status: "replied",
  },
  // 佐藤さん
  {
    id: "in5",
    customerId: "cu2",
    type: "comment",
    content: "次の入荷はいつ頃ですか?",
    category: "product_inquiry",
    createdAt: "2026-05-19T09:11:00+09:00",
    status: "unread",
  },
  {
    id: "in6",
    customerId: "cu2",
    type: "comment",
    content: "前回購入した商品とても良かったです!",
    category: "positive",
    createdAt: "2026-05-05T18:20:00+09:00",
    status: "replied",
  },
  // 中村さん
  {
    id: "in7",
    customerId: "cu3",
    type: "comment",
    content: "この商品の使い方を詳しく教えてください!",
    category: "product_inquiry",
    createdAt: "2026-05-18T18:45:00+09:00",
    status: "replied",
  },
  {
    id: "in8",
    customerId: "cu3",
    type: "reply_auto",
    content: "ご質問ありがとうございます!商品の使い方は商品ページの「使い方」セクションをご確認ください。詳細は順次担当よりお返事いたします。",
    createdAt: "2026-05-18T18:46:00+09:00",
    handledBy: "ai",
  },
  // 小林さん(新規)
  {
    id: "in9",
    customerId: "cu4",
    type: "comment",
    content: "営業時間を教えていただけますか?",
    category: "business_hours",
    createdAt: "2026-05-18T14:21:00+09:00",
    status: "unread",
  },
  // 本田さん(クレーム)
  {
    id: "in10",
    customerId: "cu5",
    type: "comment",
    content: "前回購入した商品の梱包に問題がありました",
    category: "complaint",
    createdAt: "2026-05-17T11:30:00+09:00",
    status: "unread",
  },
  {
    id: "in11",
    customerId: "cu5",
    type: "reply_manual",
    content: "大変ご迷惑をお掛けしました。担当よりDMにてご連絡いたします。",
    createdAt: "2026-05-17T11:45:00+09:00",
    handledBy: "human",
  },
];

// ============================================================
// 自動応答設定(機能① 自動応答モードのデモデータ)
// ============================================================
export const mockFaqPatterns: FaqPattern[] = [
  {
    id: "faq1",
    keyword: "営業時間",
    reply:
      "お問い合わせいただきありがとうございます。営業時間は平日10:00〜18:00、土日祝日はお休みをいただいております。詳細はDMにてお気軽にお問い合わせください。",
    enabled: true,
  },
  {
    id: "faq2",
    keyword: "入荷",
    reply:
      "ご質問ありがとうございます。入荷情報については公式アカウントで随時お知らせしております。詳細はDMにてご連絡いたします。",
    enabled: true,
  },
  {
    id: "faq3",
    keyword: "使い方",
    reply:
      "ご質問ありがとうございます!商品の使い方は商品ページの「使い方」セクションをご確認ください。詳細な使い方は順次担当よりお返事いたします。",
    enabled: true,
  },
  {
    id: "faq4",
    keyword: "価格",
    reply:
      "お問い合わせありがとうございます。価格詳細はDMでご案内いたします。少々お時間いただきますがご了承ください。",
    enabled: true,
  },
];

export const mockAutoReplySettings: AutoReplySettings = {
  enabled: false,
  businessHours: {
    enabled: true,
    start: "10:00",
    end: "18:00",
    timezone: "Asia/Tokyo",
  },
  faqPatterns: mockFaqPatterns,
  ngKeywords: ["クレーム", "返金", "弁護士", "訴える"],
  defaultTemplate:
    "お問い合わせありがとうございます。担当者より順次お返事いたします。少々お時間いただきますがご了承ください。",
};

// 自動応答ログのデモデータ
export const mockAutoReplyLogs: AutoReplyLog[] = [
  {
    id: "log1",
    commentId: "c-arc1",
    customerHandle: "yumi_style",
    customerAvatar: "/avatars/user-2.svg",
    originalComment: "営業時間を教えてください!",
    generatedReply: mockFaqPatterns[0].reply,
    matchedFaqId: "faq1",
    matchedKeyword: "営業時間",
    triggerReason: "faq_match",
    repliedAt: "2026-05-19T22:15:00+09:00",
    status: "sent",
  },
  {
    id: "log2",
    commentId: "c-arc2",
    customerHandle: "ken_photo",
    customerAvatar: "/avatars/user-1.svg",
    originalComment: "次の入荷はいつ?",
    generatedReply: mockFaqPatterns[1].reply,
    matchedFaqId: "faq2",
    matchedKeyword: "入荷",
    triggerReason: "business_hours_out",
    repliedAt: "2026-05-19T20:48:00+09:00",
    status: "sent",
  },
  {
    id: "log3",
    commentId: "c-arc3",
    customerHandle: "complaints_user",
    customerAvatar: "/avatars/user-3.svg",
    originalComment: "クレームを言いたいです",
    generatedReply: "",
    triggerReason: "manual_trigger",
    repliedAt: "2026-05-18T13:20:00+09:00",
    status: "blocked_ng",
  },
];

// ============================================================
// (申請外)Trend 機能は削除済み。互換性のため空配列だけ残す
// ============================================================
export const mockTrends: never[] = [];
