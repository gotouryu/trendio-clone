-- ============================================================
-- 2026-05-25: login_attempt_rate_limits
-- ============================================================
-- 未認証ログイン試行の総当たり/パスワードスプレー対策。
-- key は IP / email / IP+email をハッシュ化した文字列のみ保存し、
-- メールアドレスやパスワードそのものは保存しない。

create table if not exists public.login_attempt_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.login_attempt_rate_limits enable row level security;

drop policy if exists "login_attempt_rate_limits: no client access" on public.login_attempt_rate_limits;
create policy "login_attempt_rate_limits: no client access"
  on public.login_attempt_rate_limits
  for all using (false) with check (false);

create index if not exists login_attempt_rate_limits_updated_at_idx
  on public.login_attempt_rate_limits (updated_at);
