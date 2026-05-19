import { env, hasTikTok } from "./env";

const OAUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const API_BASE = "https://open.tiktokapis.com/v2";

export type TikTokKPI = {
  followers: number;
  likes: number;
  videoViews: number;
  profileViews: number;
};

/**
 * OAuth URL for TikTok account connection.
 */
export function buildTikTokOAuthUrl(state: string): string {
  if (!hasTikTok()) throw new Error("TikTok app not configured");
  const scopes = [
    "user.info.basic",
    "user.info.profile",
    "user.info.stats",
    "video.list",
    "video.insights",
  ].join(",");
  const params = new URLSearchParams({
    client_key: env.tiktokClientKey!,
    response_type: "code",
    scope: scopes,
    redirect_uri: env.tiktokOauthRedirect!,
    state,
  });
  return `${OAUTH_BASE}?${params}`;
}

/**
 * Exchange code → access token (long-lived 30days).
 */
export async function exchangeTikTokCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  open_id: string;
}> {
  if (!hasTikTok()) throw new Error("TikTok app not configured");
  const body = new URLSearchParams({
    client_key: env.tiktokClientKey!,
    client_secret: env.tiktokClientSecret!,
    code,
    grant_type: "authorization_code",
    redirect_uri: env.tiktokOauthRedirect!,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${res.status}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    open_id: string;
  };
}

/**
 * Fetch user stats (follower_count, likes_count, video_count).
 */
export async function fetchTikTokUserStats(
  accessToken: string,
): Promise<TikTokKPI> {
  const url = new URL(`${API_BASE}/user/info/`);
  url.searchParams.set(
    "fields",
    "open_id,follower_count,likes_count,video_count,profile_deep_link",
  );
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`TikTok stats failed: ${res.status}`);
  type StatsResponse = {
    data: {
      user: {
        follower_count: number;
        likes_count: number;
        video_count: number;
      };
    };
  };
  const data = (await res.json()) as StatsResponse;
  const u = data.data.user;
  return {
    followers: u.follower_count,
    likes: u.likes_count,
    videoViews: 0,
    profileViews: 0,
  };
}

/**
 * Fetch top videos with insights.
 */
export async function fetchTikTokVideos(
  accessToken: string,
  cursor?: number,
): Promise<{
  videos: { id: string; title: string; viewCount: number; likeCount: number }[];
  hasMore: boolean;
  nextCursor: number;
}> {
  const url = new URL(`${API_BASE}/video/list/`);
  url.searchParams.set(
    "fields",
    "id,title,view_count,like_count,comment_count,share_count",
  );
  const body: Record<string, unknown> = { max_count: 20 };
  if (cursor !== undefined) body.cursor = cursor;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`TikTok videos failed: ${res.status}`);
  type VideoListResponse = {
    data: {
      videos: {
        id: string;
        title: string;
        view_count: number;
        like_count: number;
      }[];
      has_more: boolean;
      cursor: number;
    };
  };
  const data = (await res.json()) as VideoListResponse;
  return {
    videos: data.data.videos.map((v) => ({
      id: v.id,
      title: v.title,
      viewCount: v.view_count,
      likeCount: v.like_count,
    })),
    hasMore: data.data.has_more,
    nextCursor: data.data.cursor,
  };
}
