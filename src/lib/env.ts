// Next.js / webpack の `process.env` は **直接プロパティアクセス** のみ静的に
// クライアントバンドルへ置換される。`process.env[name]` のような動的アクセスだと
// 静的解析できず、クライアント側では undefined になる(=サーバー側だけ動く)。
// → 全 NEXT_PUBLIC_* を直接アクセスで取得する。

function nonEmpty(v: string | undefined): string | undefined {
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  // クライアント+サーバー両方で必要(=NEXT_PUBLIC_*、bundleに埋め込まれる)
  supabaseUrl: nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  appUrl: nonEmpty(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",

  // サーバーサイドのみ(=API routes、SSR)
  supabaseServiceRole: nonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY),
  anthropicApiKey: nonEmpty(process.env.ANTHROPIC_API_KEY),
  claudeModel: nonEmpty(process.env.CLAUDE_MODEL) ?? "claude-sonnet-4-6",
  metaAppId: nonEmpty(process.env.META_APP_ID),
  metaAppSecret: nonEmpty(process.env.META_APP_SECRET),
  metaGraphApiVersion:
    nonEmpty(process.env.META_GRAPH_API_VERSION) ?? "v23.0",
  metaOauthRedirect: nonEmpty(process.env.META_OAUTH_REDIRECT),
  tiktokClientKey: nonEmpty(process.env.TIKTOK_CLIENT_KEY),
  tiktokClientSecret: nonEmpty(process.env.TIKTOK_CLIENT_SECRET),
  tiktokOauthRedirect: nonEmpty(process.env.TIKTOK_OAUTH_REDIRECT),
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
