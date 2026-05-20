-- ============================================================
-- 2026-05-21: rate_limits テーブル新設(=H3 残対応)
-- ============================================================
-- AI 系 route のレートリミットを Supabase で永続化(=Upstash 未取得のため自前実装)。
-- Fixed window 方式:user_id × kind ごとに window_started_at と count を保持。
-- ヘルパ: src/lib/rateLimit.ts の consumeRateLimit() から利用。
--
-- 適用先 route:
-- - /api/ai-reply        kind='ai_reply'   1分間 5 回
-- - /api/ai-content      kind='ai_content' 1分間 3 回
-- - /api/ai-report       kind='ai_report'  1分間 2 回

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  window_started_at timestamptz not null default now(),
  count int not null default 0,
  primary key (user_id, kind)
);

alter table public.rate_limits enable row level security;

drop policy if exists "rate_limits: own rows" on public.rate_limits;
create policy "rate_limits: own rows" on public.rate_limits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- service_role からも触れるように(=consumeRateLimit が createSupabaseAdmin 経由で
-- 書き込むため、RLS を bypass する service_role キーが必要)
-- → admin client は RLS bypass なので追加ポリシー不要、テーブル定義のみで十分。
