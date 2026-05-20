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
