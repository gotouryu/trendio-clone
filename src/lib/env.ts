function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRole: read("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  claudeModel: read("CLAUDE_MODEL") ?? "claude-sonnet-4-6",
  metaAppId: read("META_APP_ID"),
  metaAppSecret: read("META_APP_SECRET"),
  metaGraphApiVersion: read("META_GRAPH_API_VERSION") ?? "v23.0",
  metaOauthRedirect: read("META_OAUTH_REDIRECT"),
  tiktokClientKey: read("TIKTOK_CLIENT_KEY"),
  tiktokClientSecret: read("TIKTOK_CLIENT_SECRET"),
  tiktokOauthRedirect: read("TIKTOK_OAUTH_REDIRECT"),
  appUrl: read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
};

export function hasSupabase() {
  return !!(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasAnthropic() {
  return !!env.anthropicApiKey;
}

export function hasMeta() {
  return !!(env.metaAppId && env.metaAppSecret);
}

export function hasTikTok() {
  return !!(env.tiktokClientKey && env.tiktokClientSecret);
}
