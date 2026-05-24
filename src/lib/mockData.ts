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
  PlanIdea,
  GeneratedScript,
  Customer,
  CustomerInteraction,
  CustomerAIAnalysis,
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

// Phase 4 修正:i18n key 形式で保存して FollowerRegionChart 側で表示時に翻訳
export const mockRegions: RegionItem[] = [
  { name: "region.tokyo", percentage: 28.5, count: 139 },
  { name: "region.osaka", percentage: 17.3, count: 84 },
  { name: "region.kanagawa", percentage: 11.2, count: 55 },
  { name: "region.aichi", percentage: 8.6, count: 42 },
  { name: "region.kyoto", percentage: 6.4, count: 31 },
  { name: "region.hyogo", percentage: 5.5, count: 27 },
  { name: "region.fukuoka", percentage: 4.9, count: 24 },
  { name: "region.hokkaido", percentage: 4.3, count: 21 },
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
    author: "loyal_customer_01",
    authorAvatar: "/avatars/user-1.svg",
    text: "とても素敵な投稿ですね!参考になります🥰",
    textEn: "Such a lovely post! Very inspiring 🥰",
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
    textEn: "When will the next stock arrive?",
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
    textEn: "Could you tell me how to use this product?",
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
    textEn: "Could you let me know your business hours?",
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
    textEn: "There was an issue with the packaging of my last order",
    timestamp: "2026-05-17T11:30:00+09:00",
    status: "unread",
    sentiment: "negative",
    category: "complaint",
  },
  {
    id: "c6",
    postId: "p3",
    postThumbnail: "/avatars/post-3.svg",
    author: "yui_kuma_07",
    authorAvatar: "/avatars/user-2.svg",
    text: "スワイプしすぎて止まりません🥺💕 また見たいです!",
    textEn: "Cannot stop swiping 🥺💕 Want to see more!",
    timestamp: "2026-05-19T13:42:00+09:00",
    status: "unread",
    sentiment: "positive",
    category: "positive",
  },
  {
    id: "c7",
    postId: "p1",
    postThumbnail: "/avatars/post-1.svg",
    author: "taka_morning",
    authorAvatar: "/avatars/user-1.svg",
    text: "朝の通勤中に拝見しました!参考になります☕",
    textEn: "Saw this on my morning commute! So helpful ☕",
    timestamp: "2026-05-19T08:15:00+09:00",
    status: "replied",
    sentiment: "positive",
    category: "positive",
  },
  {
    id: "c8",
    postId: "p2",
    postThumbnail: "/avatars/post-2.svg",
    author: "kazu_chef_jp",
    authorAvatar: "/avatars/user-3.svg",
    text: "お値段はおいくらでしょうか?お見積もりお願いしたいです。",
    textEn: "What is the price? I would like a quote please.",
    timestamp: "2026-05-18T20:08:00+09:00",
    status: "unread",
    sentiment: "neutral",
    category: "product_inquiry",
  },
  {
    id: "c9",
    postId: "p1",
    postThumbnail: "/avatars/post-1.svg",
    author: "ririka_makeup",
    authorAvatar: "/avatars/user-2.svg",
    text: "リール用に保存しました✨ いつも素敵な投稿ありがとうございます!",
    textEn: "Saved this Reel ✨ Thanks for always sharing lovely posts!",
    timestamp: "2026-05-18T19:32:00+09:00",
    status: "replied",
    sentiment: "positive",
    category: "positive",
  },
  {
    id: "c10",
    postId: "p3",
    postThumbnail: "/avatars/post-3.svg",
    author: "ami_jp_007",
    authorAvatar: "/avatars/user-2.svg",
    text: "配送は何日くらいかかりますか?来週までに欲しいのですが…",
    textEn: "How long does shipping take? I need it by next week...",
    timestamp: "2026-05-18T16:50:00+09:00",
    status: "unread",
    sentiment: "neutral",
    category: "product_inquiry",
  },
  {
    id: "c11",
    postId: "p2",
    postThumbnail: "/avatars/post-2.svg",
    author: "hokkaido_traveler",
    authorAvatar: "/avatars/user-1.svg",
    text: "北海道にも来てくれませんか🙏 ぜひ手にとってみたいです",
    textEn: "Will you ever come to Hokkaido? 🙏 Would love to try in person",
    timestamp: "2026-05-17T22:14:00+09:00",
    status: "unread",
    sentiment: "positive",
    category: "positive",
  },
  {
    id: "c12",
    postId: "p1",
    postThumbnail: "/avatars/post-1.svg",
    author: "daisuke_works",
    authorAvatar: "/avatars/user-3.svg",
    text: "同業者です。色々勉強になります。ぜひお話ししたいです🙇",
    textEn: "Fellow business owner — very educational posts. Would love to chat 🙇",
    timestamp: "2026-05-17T14:03:00+09:00",
    status: "replied",
    sentiment: "positive",
    category: "positive",
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

// ============================================================
// AI台本生成(#7)mock — APIキー未設定でも2段階フローを確認できる
// ============================================================
export const mockPlanIdeas: PlanIdea[] = [
  {
    id: "p1",
    angle: "王道・即時訴求",
    title: "開店3秒で伝わる看板メニュー紹介",
    concept: "冒頭で一番人気を見せ、ターゲットの『これ食べたい』を即喚起する王道型",
    hook: "この一杯のために行列ができる、と言われたら見たくなりませんか?",
    outline: "1. 看板メニューのドアップ\n2. こだわり3点をテロップで\n3. 来店案内とCTA",
    trendFit: "冒頭で商品を大きく見せるショート動画の王道型",
    buzzReason: "視覚的な食欲喚起で保存・来店検討につながりやすい",
    recommendedFor: "看板商品や人気メニューを持つ店舗の認知拡大",
  },
  {
    id: "p2",
    angle: "共感・裏側",
    title: "スタッフ密着・裏側ドキュメント",
    concept: "演者(スタッフ)の人柄で親近感を作り、ファン化を狙う共感型",
    hook: "開店前の30分、ここでこんな準備をしています",
    outline: "1. 仕込み風景\n2. スタッフのこだわりひと言\n3. 『待ってます』でCTA",
    trendFit: "裏側公開・密着型の投稿フォーマット",
    buzzReason: "人柄が見えることでコメントや再訪意欲が起きやすい",
    recommendedFor: "スタッフの魅力や店舗の空気感を伝えたい場面",
  },
  {
    id: "p3",
    angle: "驚き・比較",
    title: "ビフォーアフター比較で驚きを作る",
    concept: "変化の落差で視聴維持率を上げ、保存・シェアを狙う拡散型",
    hook: "たった5分でこの変化、信じられますか?",
    outline: "1. ビフォーを見せる\n2. プロセスを早回し\n3. アフター公開とCTA",
    trendFit: "ビフォーアフター比較で最後まで見せる型",
    buzzReason: "変化の落差が視聴維持とシェアの理由になりやすい",
    recommendedFor: "施術、改善、加工、制作など変化を見せられる商材",
  },
];

export const mockGeneratedScript: GeneratedScript = {
  id: "script-mock",
  planTitle: "開店3秒で伝わる看板メニュー紹介",
  totalDurationSec: 30,
  scenes: [
    {
      sceneNo: 1,
      durationSec: 3,
      visual: "看板メニューをスローモーションでドアップ。湯気や照りを強調",
      narration: "この一杯のために、行列ができる。",
      caption: "🏆 1番人気",
      se: "シズル音(ジュー)+ 軽快なBGM開始",
    },
    {
      sceneNo: 2,
      durationSec: 12,
      visual: "食材・調理工程を3カットで。手元のアップ中心",
      narration: "厳選素材を、毎朝仕込みから。",
      caption: "こだわり ①国産素材 ②毎朝仕込み ③秘伝のタレ",
      se: "BGM継続、テロップ表示時にポップ音",
    },
    {
      sceneNo: 3,
      durationSec: 9,
      visual: "お客様が笑顔で食べるシーン。店内の雰囲気も映す",
      narration: "一度食べたら、また来たくなる。",
      caption: "笑顔になれる一杯",
      se: "BGM継続、賑わいの環境音",
    },
    {
      sceneNo: 4,
      durationSec: 6,
      visual: "店舗外観 + プロフィールリンクを指さすジェスチャー",
      narration: "ご予約はプロフィールのリンクから。",
      caption: "プロフィールのリンクから予約 →",
      se: "BGMフェードアウト + 通知音",
    },
  ],
  hashtags: ["グルメ", "ランチ", "カフェ巡り", "本日のおすすめ"],
  cta: "プロフィールのリンクから予約",
};

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
    instagramHandle: "loyal_customer_01",
    displayName: "Loyal Customer",
    profileImageUrl: "/avatars/user-1.svg",
    firstContactAt: "2026-03-12T10:00:00+09:00",
    lastContactAt: "2026-05-19T10:23:00+09:00",
    totalInteractions: 8,
    tags: ["VIP", "リピーター"],
    status: "vip",
    autoReplyEnabled: true,
    ageRange: "25-34",
    gender: "male",
    region: "region.tokyo",
    notes: "新商品ローンチ時に積極的にコメントしてくれる優良顧客",
  },
  {
    id: "cu2",
    instagramHandle: "sakura_jp",
    displayName: "Sakura Sato",
    profileImageUrl: "/avatars/user-2.svg",
    firstContactAt: "2026-04-08T15:30:00+09:00",
    lastContactAt: "2026-05-19T09:11:00+09:00",
    totalInteractions: 5,
    tags: ["既存顧客", "問い合わせ多"],
    status: "active",
    autoReplyEnabled: true,
    ageRange: "18-24",
    gender: "female",
    region: "region.osaka",
  },
  {
    id: "cu3",
    instagramHandle: "marketing_pro",
    displayName: "Yuka Nakamura",
    profileImageUrl: "/avatars/user-3.svg",
    firstContactAt: "2026-05-01T12:00:00+09:00",
    lastContactAt: "2026-05-18T18:45:00+09:00",
    totalInteractions: 3,
    tags: ["新規"],
    status: "follow_up",
    autoReplyEnabled: true,
    ageRange: "25-34",
    gender: "female",
    region: "region.kanagawa",
  },
  {
    id: "cu4",
    instagramHandle: "kosuke_design",
    displayName: "Kosuke Kobayashi",
    profileImageUrl: "/avatars/user-1.svg",
    firstContactAt: "2026-05-18T14:21:00+09:00",
    lastContactAt: "2026-05-18T14:21:00+09:00",
    totalInteractions: 1,
    tags: ["新規"],
    status: "new",
    autoReplyEnabled: true,
    ageRange: "35-44",
    gender: "male",
    region: "region.kyoto",
  },
  {
    id: "cu5",
    instagramHandle: "minori_lab",
    displayName: "Minori Honda",
    profileImageUrl: "/avatars/user-2.svg",
    firstContactAt: "2026-04-25T09:00:00+09:00",
    lastContactAt: "2026-05-17T11:30:00+09:00",
    totalInteractions: 4,
    tags: ["クレーム経験"],
    status: "follow_up",
    autoReplyEnabled: false,
    ageRange: "25-34",
    gender: "female",
    region: "region.aichi",
    notes: "梱包品質クレーム対応中。手動応答に切替。",
  },
  {
    id: "cu6",
    instagramHandle: "yui_kuma_07",
    displayName: "Yui Kumai",
    profileImageUrl: "/avatars/user-2.svg",
    firstContactAt: "2026-04-30T19:00:00+09:00",
    lastContactAt: "2026-05-19T13:42:00+09:00",
    totalInteractions: 6,
    tags: ["既存顧客", "リピーター"],
    status: "active",
    autoReplyEnabled: true,
    ageRange: "18-24",
    gender: "female",
    region: "region.tokyo",
    notes: "リール経由の流入。週1ペースでコメントあり。",
  },
  {
    id: "cu7",
    instagramHandle: "kazu_chef_jp",
    displayName: "Kazuaki Morita",
    profileImageUrl: "/avatars/user-3.svg",
    firstContactAt: "2026-05-15T17:30:00+09:00",
    lastContactAt: "2026-05-18T20:08:00+09:00",
    totalInteractions: 2,
    tags: ["新規", "問い合わせ多"],
    status: "follow_up",
    autoReplyEnabled: true,
    ageRange: "35-44",
    gender: "male",
    region: "region.hyogo",
    notes: "業務用での購入検討。担当より個別フォロー予定。",
  },
  {
    id: "cu8",
    instagramHandle: "ririka_makeup",
    displayName: "Rika Sasaki",
    profileImageUrl: "/avatars/user-2.svg",
    firstContactAt: "2026-04-12T11:00:00+09:00",
    lastContactAt: "2026-05-18T19:32:00+09:00",
    totalInteractions: 7,
    tags: ["VIP", "リピーター"],
    status: "vip",
    autoReplyEnabled: true,
    ageRange: "25-34",
    gender: "female",
    region: "region.fukuoka",
    notes: "リール保存率高め。ストーリーでのメンションも複数回。",
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
  // 山田さん(VIP)— 追加で接点履歴を充実
  {
    id: "in12",
    customerId: "cu1",
    type: "reply_auto",
    content:
      "新商品のリリース情報をお知らせいただきありがとうございます!担当より順次お返事いたします。",
    createdAt: "2026-04-28T11:01:00+09:00",
    handledBy: "ai",
  },
  {
    id: "in13",
    customerId: "cu1",
    type: "comment",
    content: "リール拝見しました!新色も楽しみにしてます🥰",
    category: "positive",
    createdAt: "2026-04-15T22:30:00+09:00",
    status: "replied",
  },
  // 熊井 結さん
  {
    id: "in14",
    customerId: "cu6",
    type: "comment",
    content: "スワイプしすぎて止まりません🥺💕 また見たいです!",
    category: "positive",
    createdAt: "2026-05-19T13:42:00+09:00",
    status: "unread",
  },
  {
    id: "in15",
    customerId: "cu6",
    type: "comment",
    content: "リール用に何回も保存してます!次回も楽しみ✨",
    category: "positive",
    createdAt: "2026-05-12T20:15:00+09:00",
    status: "replied",
  },
  {
    id: "in16",
    customerId: "cu6",
    type: "reply_auto",
    content: "いつもありがとうございます!引き続きよろしくお願いします😊",
    createdAt: "2026-05-12T20:16:00+09:00",
    handledBy: "ai",
  },
  // 森田 和明さん(見積依頼)
  {
    id: "in17",
    customerId: "cu7",
    type: "comment",
    content: "お値段はおいくらでしょうか?お見積もりお願いしたいです。",
    category: "product_inquiry",
    createdAt: "2026-05-18T20:08:00+09:00",
    status: "unread",
  },
  {
    id: "in18",
    customerId: "cu7",
    type: "reply_auto",
    content:
      "お問い合わせありがとうございます。価格詳細はDMでご案内いたします。少々お時間いただきますがご了承ください。",
    createdAt: "2026-05-18T20:09:00+09:00",
    handledBy: "ai",
  },
  // 佐々木 莉花さん(VIP)
  {
    id: "in19",
    customerId: "cu8",
    type: "comment",
    content: "リール用に保存しました✨ いつも素敵な投稿ありがとうございます!",
    category: "positive",
    createdAt: "2026-05-18T19:32:00+09:00",
    status: "replied",
  },
  {
    id: "in20",
    customerId: "cu8",
    type: "reply_manual",
    content:
      "莉花さん、いつも応援ありがとうございます!次回の新商品もぜひお楽しみに☺️",
    createdAt: "2026-05-18T19:50:00+09:00",
    handledBy: "human",
  },
  {
    id: "in21",
    customerId: "cu8",
    type: "comment",
    content: "ストーリーで紹介させていただきました!",
    category: "positive",
    createdAt: "2026-05-08T14:00:00+09:00",
    status: "replied",
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
  {
    id: "log4",
    commentId: "c-arc4",
    customerHandle: "marketing_pro",
    customerAvatar: "/avatars/user-3.svg",
    originalComment: "この商品の使い方を詳しく教えてください!",
    generatedReply: mockFaqPatterns[2].reply,
    matchedFaqId: "faq3",
    matchedKeyword: "使い方",
    triggerReason: "faq_match",
    repliedAt: "2026-05-18T18:46:00+09:00",
    status: "sent",
  },
  {
    id: "log5",
    commentId: "c-arc5",
    customerHandle: "kazu_chef_jp",
    customerAvatar: "/avatars/user-3.svg",
    originalComment: "お値段はおいくらでしょうか?お見積もりお願いしたいです。",
    generatedReply: mockFaqPatterns[3].reply,
    matchedFaqId: "faq4",
    matchedKeyword: "価格",
    triggerReason: "faq_match",
    repliedAt: "2026-05-18T20:09:00+09:00",
    status: "sent",
  },
  {
    id: "log6",
    commentId: "c-arc6",
    customerHandle: "ami_jp_007",
    customerAvatar: "/avatars/user-2.svg",
    originalComment: "配送は何日くらいかかりますか?来週までに欲しいのですが…",
    generatedReply:
      "お問い合わせありがとうございます。担当者より順次お返事いたします。少々お時間いただきますがご了承ください。",
    triggerReason: "manual_trigger",
    repliedAt: "2026-05-18T16:51:00+09:00",
    status: "sent",
  },
  {
    id: "log7",
    commentId: "c-arc7",
    customerHandle: "yui_kuma_07",
    customerAvatar: "/avatars/user-2.svg",
    originalComment: "営業時間外ですが、相談だけでもできますか?",
    generatedReply: mockFaqPatterns[0].reply,
    matchedFaqId: "faq1",
    matchedKeyword: "営業時間",
    triggerReason: "business_hours_out",
    repliedAt: "2026-05-17T23:48:00+09:00",
    status: "sent",
  },
];

// ============================================================
// AI 顧客好み分析のデモデータ(=customer 詳細ページの初期表示用、本番DB未登録時)
// 顧客カルテ詳細ページで API が 404/空 を返した時のフォールバックに使う。
// 実データが入った時は API レスポンスで上書きされる。
// ============================================================
export const mockAIAnalyses: Record<string, CustomerAIAnalysis> = {
  cu1: {
    customerId: "cu1",
    generatedAt: "2026-05-19T10:30:00+09:00",
    interests:
      "新商品リリース情報、商品の使い方・お手入れ方法、ブランドの世界観・新色追加。リール投稿に積極的に反応し、特に新色情報への関心が高い。VIPらしく、こだわりや品質に対する目利きが鋭い印象。",
    cautions:
      "VIP扱いの最重要顧客。手厚い個別フォローを継続することが必須。返信は24時間以内が望ましい。新商品発表前の事前告知でロイヤリティ向上が期待できる。新色追加情報は最優先で個別に共有すると喜ばれる。",
    summary:
      "本顧客は4ヶ月で計8件の接点を持つ最重要顧客層に該当。ポジティブなコメントが主体で、新商品リリース時の積極的な反応が特徴。リピート購入の意思が強く、VIP対応を継続することで長期的なファン化と口コミによる紹介効果が見込める。",
  },
  cu8: {
    customerId: "cu8",
    generatedAt: "2026-05-18T20:00:00+09:00",
    interests:
      "メイクアップ関連、ビジュアル重視の投稿、季節商品。ストーリーで他者にシェアする傾向あり、紹介効果が期待できる。",
    cautions:
      "保存・シェア率が高いインフルエンサータイプの顧客。新商品の先行情報を共有して関係性を深めると良い。コメントは丁寧かつ迅速に返信。",
    summary:
      "佐々木様は1ヶ月強で7件の接点を持つ高活性 VIP 顧客。ストーリーで自社投稿を紹介してくれるなど自然な広告効果がある。先行情報の共有・限定特典の提供で関係性を深めると、より大きな波及効果が見込める。",
  },
};

// ============================================================
// (申請外)Trend 機能は削除済み。互換性のため空配列だけ残す
// ============================================================
export const mockTrends: never[] = [];
