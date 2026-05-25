export type Platform = "instagram" | "tiktok" | "all";

export type Industry =
  | "food-beverage"
  | "fashion"
  | "beauty"
  | "fitness"
  | "tech"
  | "travel"
  | "education"
  | "real-estate";

export type MarketingGoal =
  | "brand-awareness"
  | "engagement"
  | "sales-conversion"
  | "follower-growth"
  | "lead-generation";

export type DashboardKPI = {
  followers: number;
  profileViews: number;
  totalImpressions: number;
  totalReach: number;
};

export type FollowerTrendPoint = {
  date: string;
  followers: number;
};

export type ActionTrendPoint = {
  date: string;
  likes: number;
  comments: number;
  saves: number;
  clicks: number;
};

export type GenderRatio = {
  female: number;
  male: number;
  other: number;
};

export type GenderByPeriod = {
  ageGroup: string;
  male: number;
  female: number;
  other: number;
};

export type RegionItem = {
  name: string;
  percentage: number;
  count: number;
};

export type HourlyEngagement = {
  hour: number;
  engagement: number;
};

export type CommentItem = {
  id: string;
  postId: string;
  postThumbnail: string;
  author: string;
  authorAvatar: string;
  text: string;
  /**
   * 英語版テキスト(=screencast 撮影 + Meta App Review 用)。
   * 設定なら locale==='en' 時にこちらを表示。実コメント(=Instagram から取得)は
   * 元言語のまま表示するため、textEn は mockData のデモ用のみ設定される。
   */
  textEn?: string;
  timestamp: string;
  status: "unread" | "replied" | "archived";
  sentiment: "positive" | "neutral" | "negative";
  category?: InquiryCategory;
};

// TrendItem は廃止予定(=Discover Trends 機能削除済み)。互換性のため型定義のみ残す。
export type TrendItem = {
  id: string;
  title: string;
  platform: "instagram" | "tiktok";
  industry: Industry;
  views: number;
  growth: number;
  hashtags: string[];
  thumbnail: string;
};

export type ContentIdea = {
  id: string;
  title: string;
  hook: string;
  script: string;
  hashtags: string[];
  platform: "instagram" | "tiktok";
  savedAt?: string;
};

export type User = {
  id: string;
  email: string;
  companyName: string;
  language: "en" | "ja";
  instagramConnected: boolean;
  tiktokConnected: boolean;
};

// ============================================================
// Karteia: B-i 自動応答 / B-ii 顧客カルテ
// ============================================================

export type InquiryCategory =
  | "product_inquiry"   // 商品問い合わせ
  | "business_hours"    // 営業時間
  | "complaint"         // クレーム
  | "positive"          // ポジティブな声
  | "other";            // その他

export type CustomerStatus = "new" | "active" | "vip" | "follow_up" | "closed";

export type CustomerTag = "VIP" | "既存顧客" | "問い合わせ多" | "新規" | "リピーター" | "クレーム経験";

export type InteractionType =
  | "comment"        // 顧客のコメント
  | "reply_auto"     // AI自動返信
  | "reply_manual"   // 担当者の手動返信
  | "like"
  | "save";

// 顧客カルテ
export type Customer = {
  id: string;
  instagramHandle: string;
  displayName: string;
  profileImageUrl: string;
  firstContactAt: string;
  lastContactAt: string;
  totalInteractions: number;
  tags: CustomerTag[];
  status: CustomerStatus;
  autoReplyEnabled: boolean;
  notes?: string;
  ageRange?: "13-17" | "18-24" | "25-34" | "35-44" | "45+";
  gender?: "female" | "male" | "other";
  region?: string;
};

// 接点履歴
export type CustomerInteraction = {
  id: string;
  customerId: string;
  type: InteractionType;
  content: string;
  category?: InquiryCategory;
  createdAt: string;
  relatedCommentId?: string;
  handledBy?: "ai" | "human";
  status?: "unread" | "replied" | "archived";
};

// AI顧客好み分析の結果
export type CustomerAIAnalysis = {
  customerId: string;
  generatedAt: string;
  interests: string;     // 関心領域(自然文)
  cautions: string;      // 対応の注意点(自然文)
  summary: string;       // 全体サマリ
};

// 自動応答ルール設定
export type AutoReplySettings = {
  enabled: boolean;
  businessHours: {
    enabled: boolean;
    start: string; // "09:00"
    end: string;   // "18:00"
    timezone: string; // "Asia/Tokyo"
  };
  faqPatterns: FaqPattern[];
  ngKeywords: string[]; // このキーワードを含むコメントは自動応答しない
  defaultTemplate: string; // FAQ非該当時のデフォルト応答(空ならスキップ)
};

export type FaqPattern = {
  id: string;
  keyword: string;      // マッチキーワード(例:「営業時間」)
  reply: string;        // 定型応答文
  enabled: boolean;
};

// 自動応答ログ
export type AutoReplyLog = {
  id: string;
  commentId: string;
  customerHandle: string;
  customerAvatar: string;
  originalComment: string;
  generatedReply: string;
  matchedFaqId?: string;
  matchedKeyword?: string;
  triggerReason: "business_hours_out" | "faq_match" | "manual_trigger";
  repliedAt: string;
  status: "sent" | "failed" | "blocked_ng";
};

// 接客テンプレート(AI接客コンテンツ生成・機能④の出力 = 残置のみ申請外)
export type CustomerScriptTemplate = {
  id: string;
  type: "faq_reply" | "customer_script" | "reply_template" | "existing_customer";
  customerSegment: "new" | "repeater" | "general" | "complaint";
  scene: string; // 商品問い合わせ / 営業時間 / クレーム 等
  title: string;
  body: string;
  createdAt: string;
};

// ============================================================
// AI台本生成(BuzzInsight 同等)#7
//   段階①:10入力項目 → 企画案を複数生成
//   段階②:選択した企画案 → シーン別台本(映像/ナレーション/テロップ/SE/秒数)
// ============================================================

export type ScriptPlatform = "instagram" | "tiktok" | "all";

// 段階①の入力(=企画と台本の精度に使う条件)
export type ScriptBrief = {
  industry: string;        // 業種(美容、飲食、士業など)
  businessType: string;    // 業態(店舗型、オンライン、BtoBなど)
  industryDetails: string; // 業種固有の条件(価格帯、許諾、法規制、対象範囲など)
  target: string;          // ターゲット(誰に向けた動画か)
  theme: string;           // 投稿テーマ
  trendReference: string;  // 参考にしたい流行・型・競合投稿の傾向
  goal: string;            // 投稿目的(認知、保存、問い合わせなど)
  sellingPoints: string;   // 訴求ポイント・根拠
  avoidExpressions: string;// 避けたい表現
  tone: string;            // 動画トーン
  availableAssets: string; // 使える素材
  hasPerformer: boolean;   // 演者あり/なし
  hasNarration: boolean;   // ナレーションあり/なし
  mustInclude: string;     // 絶対に入れたい内容
  durationSec: number;     // 動画の長さ(秒)
  referenceUrl?: string;   // 参考URL(任意)
  cta: string;             // CTA(行動喚起)
  companyName: string;     // 会社名
  companyUrl?: string;     // 会社URL
  platform: ScriptPlatform;
};

// 段階①の出力(=企画案)
export type PlanIdea = {
  id: string;
  angle: string;       // 企画タイプ(トレンド、バズ、保存、信頼、新規性)
  title: string;       // 企画タイトル
  concept: string;     // 企画の狙い・コンセプト
  hook: string;        // 冒頭フック(掴み)
  outline: string;     // 構成の概要(数行)
  trendFit: string;    // どの流行・投稿型に寄せたか
  buzzReason: string;  // 反応が起きる理由
  recommendedFor: string; // どんな目的・状況に向くか
};

// 段階②の出力:1シーン
export type ScriptScene = {
  sceneNo: number;
  durationSec: number;  // このシーンの秒数
  visual: string;       // 映像(何を撮るか)
  narration: string;    // ナレーション/セリフ
  caption: string;      // テロップ
  se: string;           // SE(効果音/BGM)
};

// 段階②の出力:完成台本
export type GeneratedScript = {
  id: string;
  planTitle: string;
  totalDurationSec: number;
  scenes: ScriptScene[];
  hashtags: string[];
  cta: string;
  savedAt?: string;
};
