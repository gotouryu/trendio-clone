import type {
  DashboardKPI,
  FollowerTrendPoint,
  ActionTrendPoint,
  GenderRatio,
  GenderByPeriod,
  RegionItem,
  HourlyEngagement,
  CommentItem,
  TrendItem,
  ContentIdea,
} from "./types";

export const mockKPI: DashboardKPI = {
  followers: 140,
  profileViews: 0,
  totalImpressions: 0,
  totalReach: 0,
};

export const mockFollowerTrend: FollowerTrendPoint[] = Array.from(
  { length: 12 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      followers: 140,
    };
  },
);

export const mockActionTrend: ActionTrendPoint[] = [
  { date: "4/22", likes: 20, comments: 1, saves: 0, clicks: 0 },
  { date: "4/25", likes: 15, comments: 1, saves: 0, clicks: 0 },
  { date: "4/28", likes: 15, comments: 0, saves: 0, clicks: 0 },
  { date: "5/01", likes: 11, comments: 0, saves: 0, clicks: 0 },
  { date: "5/04", likes: 15, comments: 1, saves: 0, clicks: 0 },
  { date: "5/07", likes: 13, comments: 1, saves: 0, clicks: 0 },
  { date: "5/10", likes: 13, comments: 0, saves: 0, clicks: 0 },
  { date: "5/13", likes: 11, comments: 0, saves: 0, clicks: 0 },
  { date: "5/16", likes: 5, comments: 0, saves: 0, clicks: 0 },
  { date: "5/18", likes: 5, comments: 0, saves: 0, clicks: 0 },
  { date: "5/19", likes: 7, comments: 0, saves: 0, clicks: 0 },
];

export const mockGenderRatio: GenderRatio = {
  female: 27,
  male: 19,
  other: 54,
};

export const mockGenderByPeriod: GenderByPeriod[] = [
  { ageGroup: "13-17", male: 0, female: 0, other: 8 },
  { ageGroup: "18-24", male: 8, female: 20, other: 73 },
  { ageGroup: "25-34", male: 22, female: 27, other: 50 },
  { ageGroup: "35+", male: 17, female: 33, other: 50 },
];

export const mockRegions: RegionItem[] = [
  { name: "JP", percentage: 50.2, count: 127 },
  { name: "京都府京都市", percentage: 9.9, count: 25 },
  { name: "大阪府大阪市", percentage: 5.1, count: 13 },
  { name: "愛知県名古屋市", percentage: 2.4, count: 6 },
  { name: "京都府京田辺市", percentage: 1.6, count: 4 },
  { name: "岐阜県瑞穂市", percentage: 1.6, count: 4 },
  { name: "大阪府高槻市", percentage: 1.6, count: 4 },
  { name: "神奈川県横浜市", percentage: 1.6, count: 4 },
];

export const mockHourlyEngagement: HourlyEngagement[] = Array.from(
  { length: 24 },
  (_, h) => {
    const base =
      h === 8 ? 33 : h === 17 ? 34 : h === 3 ? 30 : Math.floor(Math.random() * 8);
    return { hour: h, engagement: base };
  },
);

export const mockComments: CommentItem[] = [
  {
    id: "c1",
    postId: "p1",
    postThumbnail: "https://placehold.co/100x100/fed7aa/9a3412?text=Post1",
    author: "yamada_taro",
    authorAvatar: "https://placehold.co/40x40/10b981/ffffff?text=Y",
    text: "とても素敵な投稿ですね!参考になります🥰",
    timestamp: "2026-05-19T10:23:00+09:00",
    status: "unread",
    sentiment: "positive",
  },
  {
    id: "c2",
    postId: "p2",
    postThumbnail: "https://placehold.co/100x100/fb923c/ffffff?text=Post2",
    author: "sakura_jp",
    authorAvatar: "https://placehold.co/40x40/f97316/ffffff?text=S",
    text: "次の入荷はいつ頃ですか?",
    timestamp: "2026-05-19T09:11:00+09:00",
    status: "unread",
    sentiment: "neutral",
  },
  {
    id: "c3",
    postId: "p3",
    postThumbnail: "https://placehold.co/100x100/f87171/ffffff?text=Post3",
    author: "marketing_pro",
    authorAvatar: "https://placehold.co/40x40/0ea5e9/ffffff?text=M",
    text: "この商品の使い方を詳しく教えてください!",
    timestamp: "2026-05-18T18:45:00+09:00",
    status: "replied",
    sentiment: "positive",
  },
];

export const mockTrends: TrendItem[] = [
  {
    id: "t1",
    title: "おうちカフェ vlog",
    platform: "instagram",
    industry: "food-beverage",
    views: 1240000,
    growth: 87,
    hashtags: ["おうちカフェ", "コーヒー時間", "リール"],
    thumbnail: "https://placehold.co/300x400/fed7aa/9a3412?text=おうちカフェ",
  },
  {
    id: "t2",
    title: "30秒で作れる時短レシピ",
    platform: "tiktok",
    industry: "food-beverage",
    views: 2800000,
    growth: 134,
    hashtags: ["時短レシピ", "簡単料理", "TikTokレシピ"],
    thumbnail: "https://placehold.co/300x400/fb923c/ffffff?text=時短レシピ",
  },
  {
    id: "t3",
    title: "新作スイーツ食べ歩き",
    platform: "instagram",
    industry: "food-beverage",
    views: 980000,
    growth: 62,
    hashtags: ["スイーツ巡り", "新作スイーツ", "カフェ巡り"],
    thumbnail: "https://placehold.co/300x400/f87171/ffffff?text=スイーツ",
  },
];

export const mockContentIdeas: ContentIdea[] = [
  {
    id: "ci1",
    title: "新商品の魅力を3つのポイントで紹介",
    hook: "「えっ、これ知ってた?」で始めて視聴者の興味を惹きつける",
    script:
      "1. オープニング(3秒):衝撃的な事実\n2. 本編(20秒):3つの特徴を解説\n3. CTA(5秒):プロフィールリンクへ誘導",
    hashtags: ["新商品", "おすすめ", "PR"],
    platform: "instagram",
    savedAt: "2026-05-15",
  },
  {
    id: "ci2",
    title: "ユーザー声を生かしたQ&A形式",
    hook: "「お客様からよく聞かれる質問TOP3」",
    script:
      "Q1: 一番人気の味は?\nA: 〇〇です。理由は…\nQ2: 価格は?\nA: …\nQ3: どこで買える?\nA: …",
    hashtags: ["Q&A", "ユーザーの声"],
    platform: "tiktok",
    savedAt: "2026-05-12",
  },
];

export const industryOptions: { value: string; label: string }[] = [
  { value: "food-beverage", label: "Food & Beverage / 飲食" },
  { value: "fashion", label: "Fashion / ファッション" },
  { value: "beauty", label: "Beauty / 美容" },
  { value: "fitness", label: "Fitness / フィットネス" },
  { value: "tech", label: "Tech / テック" },
  { value: "travel", label: "Travel / 旅行" },
  { value: "education", label: "Education / 教育" },
  { value: "real-estate", label: "Real Estate / 不動産" },
];

export const goalOptions: { value: string; label: string }[] = [
  { value: "brand-awareness", label: "ブランド認知を高める" },
  { value: "engagement", label: "エンゲージメント向上" },
  { value: "sales-conversion", label: "売上・コンバージョン" },
  { value: "follower-growth", label: "フォロワー獲得" },
  { value: "lead-generation", label: "リード獲得" },
];
