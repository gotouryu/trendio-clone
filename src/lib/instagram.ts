import { env, hasMeta } from "./env";
import { timeoutSignal } from "./timeout";

const GRAPH_BASE = "https://graph.facebook.com";

export type IGInsightsResult = {
  followers: number;
  profileViews: number;
  totalImpressions: number;
  totalReach: number;
};

export type IGActionTrendPoint = {
  date: string;
  likes: number;
  comments: number;
  saves: number;
  clicks: number;
};

/**
 * Build the Meta OAuth URL the user clicks to grant Instagram permission.
 * Used by /api/auth/instagram (route to be added in Phase 5).
 */
export function buildInstagramOAuthUrl(state: string): string {
  if (!hasMeta()) throw new Error("Meta App not configured");
  const scope = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");
  const params = new URLSearchParams({
    client_id: env.metaAppId!,
    redirect_uri: env.metaOauthRedirect!,
    state,
    scope,
    response_type: "code",
  });
  return `https://www.facebook.com/${env.metaGraphApiVersion}/dialog/oauth?${params}`;
}

/**
 * Exchange OAuth code for short-lived user access token, then exchange to long-lived.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!hasMeta()) throw new Error("Meta App not configured");
  const url = new URL(`${GRAPH_BASE}/${env.metaGraphApiVersion}/oauth/access_token`);
  url.searchParams.set("client_id", env.metaAppId!);
  url.searchParams.set("client_secret", env.metaAppSecret!);
  url.searchParams.set("redirect_uri", env.metaOauthRedirect!);
  url.searchParams.set("code", code);
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Find the Instagram Business Account ID linked to a Facebook page the user manages.
 */
export async function getInstagramBusinessAccountId(
  userAccessToken: string,
): Promise<{ pageId: string; igUserId: string } | null> {
  const pagesUrl = new URL(
    `${GRAPH_BASE}/${env.metaGraphApiVersion}/me/accounts`,
  );
  pagesUrl.searchParams.set("access_token", userAccessToken);
  const pagesRes = await fetch(pagesUrl, { signal: timeoutSignal() });
  if (!pagesRes.ok) return null;
  const pagesData = (await pagesRes.json()) as {
    data: { id: string; access_token: string }[];
  };
  for (const page of pagesData.data) {
    const igUrl = new URL(
      `${GRAPH_BASE}/${env.metaGraphApiVersion}/${page.id}`,
    );
    igUrl.searchParams.set("fields", "instagram_business_account");
    igUrl.searchParams.set("access_token", page.access_token);
    const igRes = await fetch(igUrl, { signal: timeoutSignal() });
    if (!igRes.ok) continue;
    const igData = (await igRes.json()) as {
      instagram_business_account?: { id: string };
    };
    if (igData.instagram_business_account?.id) {
      return { pageId: page.id, igUserId: igData.instagram_business_account.id };
    }
  }
  return null;
}

/**
 * Fetch account-level insights (followers / profile views / impressions / reach).
 */
export async function fetchInsights(
  igUserId: string,
  accessToken: string,
  since?: string,
  until?: string,
): Promise<IGInsightsResult> {
  const url = new URL(`${GRAPH_BASE}/${env.metaGraphApiVersion}/${igUserId}/insights`);
  url.searchParams.set("metric", "follower_count,profile_views,impressions,reach");
  url.searchParams.set("period", "day");
  if (since) url.searchParams.set("since", since);
  if (until) url.searchParams.set("until", until);
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Instagram insights failed: ${res.status}`);
  const data = (await res.json()) as {
    data: { name: string; values: { value: number }[] }[];
  };
  const sum = (name: string) =>
    data.data
      .find((m) => m.name === name)
      ?.values.reduce((s, v) => s + v.value, 0) ?? 0;
  return {
    followers: sum("follower_count"),
    profileViews: sum("profile_views"),
    totalImpressions: sum("impressions"),
    totalReach: sum("reach"),
  };
}

/**
 * Fetch follower demographics (age/gender/region).
 */
export async function fetchAudienceDemographics(
  igUserId: string,
  accessToken: string,
): Promise<{
  gender: { male: number; female: number; other: number };
  ageGroups: Record<string, number>;
  cities: Record<string, number>;
}> {
  const url = new URL(`${GRAPH_BASE}/${env.metaGraphApiVersion}/${igUserId}/insights`);
  url.searchParams.set(
    "metric",
    "audience_gender_age,audience_city",
  );
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Demographics failed: ${res.status}`);
  // Meta returns { data: [{ name, values: [{ value: { 'M.18-24': 10, ... } }] }] }
  type DemographicsResponse = {
    data: { name: string; values: { value: Record<string, number> }[] }[];
  };
  const data = (await res.json()) as DemographicsResponse;
  const genderAge = data.data.find((m) => m.name === "audience_gender_age");
  const cities = data.data.find((m) => m.name === "audience_city");
  const ga = (genderAge?.values?.[0]?.value as Record<string, number>) ?? {};
  const cityVal = (cities?.values?.[0]?.value as Record<string, number>) ?? {};
  let male = 0,
    female = 0,
    other = 0;
  const ageGroups: Record<string, number> = {};
  for (const [k, v] of Object.entries(ga)) {
    const [g, age] = k.split(".");
    if (g === "M") male += v;
    else if (g === "F") female += v;
    else other += v;
    ageGroups[age] = (ageGroups[age] ?? 0) + v;
  }
  return { gender: { male, female, other }, ageGroups, cities: cityVal };
}
