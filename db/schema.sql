-- Karteia — Supabase schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/<id>/sql/new)
-- All tables use Row Level Security (RLS) so each user only sees their own rows.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. profiles — extends auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  language text not null default 'ja',
  role text not null default 'customer' check (role in ('customer','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: is_admin(uid) — SECURITY DEFINER で RLS の再帰を回避
-- (=ポリシー内で profiles を直接 SELECT すると無限再帰になるため、判定ロジックを関数化)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

-- Customer can read/update only their own row; admin can read all
drop policy if exists "profiles: own row or admin read" on public.profiles;
create policy "profiles: own row or admin read"
  on public.profiles for select using (
    auth.uid() = id
    or public.is_admin(auth.uid())
  );
drop policy if exists "profiles: own row update" on public.profiles;
create policy "profiles: own row update"
  on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles: admin can update any" on public.profiles;
create policy "profiles: admin can update any"
  on public.profiles for update using (
    public.is_admin(auth.uid())
  );
drop policy if exists "profiles: own row insert" on public.profiles;
create policy "profiles: own row insert"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup (default role = customer)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'company_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. sns_accounts — connected Instagram/TikTok accounts per user
-- ============================================================
create table if not exists public.sns_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok')),
  external_account_id text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  display_name text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.sns_accounts enable row level security;

drop policy if exists "sns_accounts: own rows" on public.sns_accounts;
create policy "sns_accounts: own rows" on public.sns_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 3. analytics_snapshots — daily KPI rollups per account
-- ============================================================
create table if not exists public.analytics_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sns_account_id uuid not null references public.sns_accounts(id) on delete cascade,
  snapshot_date date not null,
  followers int default 0,
  profile_views int default 0,
  impressions int default 0,
  reach int default 0,
  likes int default 0,
  comments int default 0,
  saves int default 0,
  clicks int default 0,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (sns_account_id, snapshot_date)
);

create index if not exists analytics_snapshots_user_date_idx
  on public.analytics_snapshots (user_id, snapshot_date desc);

alter table public.analytics_snapshots enable row level security;
drop policy if exists "analytics: own rows" on public.analytics_snapshots;
create policy "analytics: own rows" on public.analytics_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 4. ig_comments — fetched Instagram comments + reply status + category
-- ============================================================
create table if not exists public.ig_comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid,                                            -- FK は customers 定義後に alter で追加
  external_comment_id text not null,
  external_post_id text,
  author_username text,
  author_avatar text,
  text text,
  posted_at timestamptz,
  status text not null default 'unread' check (status in ('unread','replied','archived')),
  sentiment text check (sentiment in ('positive','neutral','negative')),
  category text check (category in ('product_inquiry','business_hours','complaint','positive','other')),
  reply_text text,
  reply_handled_by text check (reply_handled_by in ('ai','human')),
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, external_comment_id)
);

create index if not exists ig_comments_user_status_idx
  on public.ig_comments (user_id, status, posted_at desc);
create index if not exists ig_comments_user_customer_idx
  on public.ig_comments (user_id, customer_id, posted_at desc);

alter table public.ig_comments enable row level security;
drop policy if exists "ig_comments: own rows" on public.ig_comments;
create policy "ig_comments: own rows" on public.ig_comments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 5. saved_content_ideas — kept for backward compatibility (=AI Content機能 残置)
-- ============================================================
create table if not exists public.saved_content_ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  hook text,
  script text,
  hashtags text[],
  platform text check (platform in ('instagram','tiktok')),
  industry text,
  goal text,
  generation_params jsonb,
  created_at timestamptz not null default now()
);

alter table public.saved_content_ideas enable row level security;
drop policy if exists "saved_content: own rows" on public.saved_content_ideas;
create policy "saved_content: own rows" on public.saved_content_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 6. ai_reports — generated insight reports (whitepaper)
-- ============================================================
create table if not exists public.ai_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok')),
  period_label text,
  markdown text not null,
  source_kpi jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_reports_user_created_idx
  on public.ai_reports (user_id, created_at desc);

alter table public.ai_reports enable row level security;
drop policy if exists "ai_reports: own rows" on public.ai_reports;
create policy "ai_reports: own rows" on public.ai_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 7. login_events — login history for usage tracking
-- ============================================================
create table if not exists public.login_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_in_at timestamptz not null default now(),
  ip text,
  user_agent text
);

create index if not exists login_events_user_time_idx
  on public.login_events (user_id, logged_in_at desc);

alter table public.login_events enable row level security;

drop policy if exists "login_events: insert own" on public.login_events;
create policy "login_events: insert own"
  on public.login_events for insert with check (auth.uid() = user_id);
drop policy if exists "login_events: select own or admin" on public.login_events;
create policy "login_events: select own or admin"
  on public.login_events for select using (
    auth.uid() = user_id
    or public.is_admin(auth.uid())
  );

-- ============================================================
-- 7b. login_attempt_rate_limits — unauthenticated login attack guard
-- ============================================================
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

-- ============================================================
-- 7c. rate_limits — authenticated API attack guard
-- ============================================================
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

create or replace function public.consume_rate_limit(
  p_user_id uuid,
  p_kind text,
  p_window_sec int,
  p_max_in_window int
)
returns table (allowed boolean, retry_after_sec int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started timestamptz;
begin
  insert into public.rate_limits (user_id, kind, window_started_at, count)
  values (p_user_id, p_kind, now(), 0)
  on conflict (user_id, kind) do nothing;

  update public.rate_limits
     set window_started_at = case
           when extract(epoch from (now() - window_started_at)) >= p_window_sec
           then now()
           else window_started_at
         end,
         count = case
           when extract(epoch from (now() - window_started_at)) >= p_window_sec
           then 1
           else count + 1
         end
   where user_id = p_user_id
     and kind = p_kind
     and (
       extract(epoch from (now() - window_started_at)) >= p_window_sec
       or count < p_max_in_window
     )
   returning true, 0 into allowed, retry_after_sec;

  if allowed is true then
    return next;
    return;
  end if;

  select window_started_at
    into v_started
    from public.rate_limits
   where user_id = p_user_id
     and kind = p_kind;

  allowed := false;
  retry_after_sec := greatest(
    1,
    ceil(p_window_sec - extract(epoch from (now() - v_started)))::int
  );
  return next;
end;
$$;

grant execute on function public.consume_rate_limit(uuid, text, int, int) to service_role;

create or replace function public.record_login_attempt_rate_limit(
  p_key text,
  p_window_sec int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.login_attempt_rate_limits (key, window_started_at, count, updated_at)
  values (p_key, now(), 1, now())
  on conflict (key) do update
    set window_started_at = case
          when extract(epoch from (now() - login_attempt_rate_limits.window_started_at)) >= p_window_sec
          then now()
          else login_attempt_rate_limits.window_started_at
        end,
        count = case
          when extract(epoch from (now() - login_attempt_rate_limits.window_started_at)) >= p_window_sec
          then 1
          else login_attempt_rate_limits.count + 1
        end,
        updated_at = now();
end;
$$;

grant execute on function public.record_login_attempt_rate_limit(text, int) to service_role;

-- ============================================================
-- 8. customers — 顧客カルテ(共P-01 顧客行動履歴・CRM)
-- ============================================================
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instagram_handle text not null,
  display_name text,
  profile_image_url text,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  total_interactions int not null default 0,
  tags text[] not null default '{}',
  status text not null default 'new' check (status in ('new','active','vip','follow_up','closed')),
  auto_reply_enabled boolean not null default true,
  notes text,
  age_range text check (age_range in ('13-17','18-24','25-34','35-44','45+')),
  gender text check (gender in ('female','male','other')),
  region text,
  ai_analysis jsonb,                       -- 直近のAI好み分析の結果(interests / cautions / summary)
  ai_analysis_at timestamptz,              -- 直近の分析時刻(レートリミット判定)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, instagram_handle)
);

create index if not exists customers_user_last_contact_idx
  on public.customers (user_id, last_contact_at desc);
create index if not exists customers_user_status_idx
  on public.customers (user_id, status);

alter table public.customers enable row level security;
drop policy if exists "customers: own rows" on public.customers;
create policy "customers: own rows" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 9. customer_interactions — 顧客との接点履歴(共P-01 接点蓄積)
-- ============================================================
create table if not exists public.customer_interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null check (type in ('comment','reply_auto','reply_manual','like','save')),
  content text,
  category text check (category in ('product_inquiry','business_hours','complaint','positive','other')),
  related_comment_id uuid references public.ig_comments(id) on delete set null,
  handled_by text check (handled_by in ('ai','human')),
  status text check (status in ('unread','replied','archived')),
  created_at timestamptz not null default now()
);

create index if not exists customer_interactions_user_customer_idx
  on public.customer_interactions (user_id, customer_id, created_at desc);
create index if not exists customer_interactions_user_created_idx
  on public.customer_interactions (user_id, created_at desc);

alter table public.customer_interactions enable row level security;
drop policy if exists "customer_interactions: own rows" on public.customer_interactions;
create policy "customer_interactions: own rows" on public.customer_interactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 集計ビュー:顧客カルテ一覧で使う
create or replace view public.customer_overview_v
with (security_invoker = true) as
select
  c.id,
  c.user_id,
  c.instagram_handle,
  c.display_name,
  c.profile_image_url,
  c.first_contact_at,
  c.last_contact_at,
  c.total_interactions,
  c.tags,
  c.status,
  c.auto_reply_enabled,
  c.age_range,
  c.gender,
  c.region,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.category = 'product_inquiry') as product_inquiry_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.category = 'complaint') as complaint_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.category = 'positive') as positive_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.type in ('reply_auto')) as auto_reply_count,
  c.created_at,
  c.updated_at
from public.customers c;

-- ============================================================
-- 10. auto_reply_settings — 自動応答ルール設定(機能① 自動応答モード)
-- ============================================================
create table if not exists public.auto_reply_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,                       -- 自動応答モード ON/OFF
  business_hours jsonb not null default jsonb_build_object(
    'enabled', true,
    'start', '09:00',
    'end', '18:00',
    'timezone', 'Asia/Tokyo'
  ),                                                            -- 営業時間設定
  faq_patterns jsonb not null default '[]'::jsonb,              -- FAQパターン配列
  ng_keywords text[] not null default '{}',                     -- NGワード
  default_template text not null default '',                    -- デフォルト応答
  updated_at timestamptz not null default now()
);

alter table public.auto_reply_settings enable row level security;
drop policy if exists "auto_reply_settings: own rows" on public.auto_reply_settings;
create policy "auto_reply_settings: own rows" on public.auto_reply_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 11. auto_reply_logs — 自動応答実行ログ
-- ============================================================
create table if not exists public.auto_reply_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid references public.ig_comments(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_handle text,
  customer_avatar text,
  original_comment text,
  generated_reply text,
  matched_faq_id text,
  matched_keyword text,
  trigger_reason text check (trigger_reason in ('business_hours_out','faq_match','manual_trigger')),
  status text not null default 'sent' check (status in ('sent','failed','blocked_ng')),
  replied_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists auto_reply_logs_user_time_idx
  on public.auto_reply_logs (user_id, replied_at desc);

alter table public.auto_reply_logs enable row level security;
drop policy if exists "auto_reply_logs: own rows" on public.auto_reply_logs;
create policy "auto_reply_logs: own rows" on public.auto_reply_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 12. comment_processing_queue — 自動応答処理キュー
-- ============================================================
create table if not exists public.comment_processing_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references public.ig_comments(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','done','failed','skipped')),
  attempts int not null default 0,
  error text,
  enqueued_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists queue_user_status_idx
  on public.comment_processing_queue (user_id, status, enqueued_at);

alter table public.comment_processing_queue enable row level security;
drop policy if exists "queue: own rows" on public.comment_processing_queue;
create policy "queue: own rows" on public.comment_processing_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 13. ai_content_monthly_usage — AI台本生成の月間利用上限
-- ============================================================
create table if not exists public.ai_content_monthly_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  count int not null default 0 check (count >= 0),
  monthly_limit int not null default 20 check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.ai_content_monthly_usage enable row level security;

drop policy if exists "ai_content_monthly_usage: own rows" on public.ai_content_monthly_usage;
create policy "ai_content_monthly_usage: own rows"
  on public.ai_content_monthly_usage
  for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ============================================================
-- 14. ai_content_generation_logs — AI台本生成ログ
-- ============================================================
create table if not exists public.ai_content_generation_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  mode text not null check (mode in ('plans', 'script')),
  provider text not null default 'gemini',
  model text,
  counted boolean not null default false,
  mock boolean not null default false,
  status text not null check (status in ('success', 'blocked_quota', 'fallback', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_content_generation_logs_user_month_idx
  on public.ai_content_generation_logs (user_id, month, created_at desc);

alter table public.ai_content_generation_logs enable row level security;

drop policy if exists "ai_content_generation_logs: own rows" on public.ai_content_generation_logs;
create policy "ai_content_generation_logs: own rows"
  on public.ai_content_generation_logs
  for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

create or replace function public.consume_ai_content_monthly_quota(
  p_user_id uuid,
  p_month text,
  p_limit int default 20
)
returns table (
  allowed boolean,
  used int,
  monthly_limit int,
  remaining int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_limit int;
begin
  if p_limit <= 0 then
    raise exception 'p_limit must be positive';
  end if;

  insert into public.ai_content_monthly_usage (user_id, month, count, monthly_limit)
  values (p_user_id, p_month, 0, p_limit)
  on conflict (user_id, month) do nothing;

  update public.ai_content_monthly_usage u
     set count = u.count + 1,
         monthly_limit = p_limit,
         updated_at = now()
   where u.user_id = p_user_id
     and u.month = p_month
     and u.count < p_limit
   returning u.count, u.monthly_limit into v_count, v_limit;

  if found then
    return query select true, v_count, v_limit, greatest(v_limit - v_count, 0);
    return;
  end if;

  select u.count, u.monthly_limit
    into v_count, v_limit
    from public.ai_content_monthly_usage u
   where u.user_id = p_user_id
     and u.month = p_month;

  return query select false, coalesce(v_count, 0), coalesce(v_limit, p_limit), 0;
end;
$$;

revoke execute on function public.consume_ai_content_monthly_quota(uuid, text, int) from public;
revoke execute on function public.consume_ai_content_monthly_quota(uuid, text, int) from anon;
revoke execute on function public.consume_ai_content_monthly_quota(uuid, text, int) from authenticated;
grant execute on function public.consume_ai_content_monthly_quota(uuid, text, int) to service_role;

-- ============================================================
-- Aggregate view for admin dashboard (customer_usage)
-- ============================================================
create or replace view public.customer_usage as
select
  p.id,
  p.company_name,
  p.role,
  p.status,
  p.created_at as registered_at,
  (select max(logged_in_at) from public.login_events e where e.user_id = p.id) as last_login_at,
  (select count(*) from public.login_events e
    where e.user_id = p.id
    and e.logged_in_at >= now() - interval '30 days') as logins_30d,
  greatest(0, extract(day from now() - p.created_at)::int) as days_since_register
from public.profiles p
where p.role = 'customer';

-- ============================================================
-- updated_at trigger helper
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 顧客 last_contact_at / total_interactions 自動更新トリガー
-- (customer_interactions INSERT 時に customers を更新)
-- ============================================================
create or replace function public.bump_customer_aggregate()
returns trigger as $$
begin
  update public.customers
  set
    total_interactions = total_interactions + 1,
    last_contact_at = new.created_at,
    first_contact_at = coalesce(first_contact_at, new.created_at),
    updated_at = now()
  where id = new.customer_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists customer_interactions_aggregate on public.customer_interactions;
create trigger customer_interactions_aggregate
  after insert on public.customer_interactions
  for each row execute function public.bump_customer_aggregate();

-- ============================================================
-- ig_comments.customer_id → customers.id 外部キーを後付け
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ig_comments_customer_id_fkey'
  ) then
    alter table public.ig_comments
      add constraint ig_comments_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
end$$;
