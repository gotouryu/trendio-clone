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
};

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
