-- Trendio Clone — Supabase schema
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
  company_name text not null default 'サンプル',
  language text not null default 'ja',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own row read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: own row update"
  on public.profiles for update using (auth.uid() = id);
create policy "profiles: own row insert"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'company_name', 'サンプル'));
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
  external_account_id text not null,   -- IG business account id / TikTok open_id
  access_token text not null,           -- encrypt at app layer if storing long-term
  refresh_token text,
  expires_at timestamptz,
  display_name text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.sns_accounts enable row level security;

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

create policy "analytics: own rows" on public.analytics_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 4. ig_comments — fetched Instagram comments + reply status
-- ============================================================
create table if not exists public.ig_comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_comment_id text not null,
  external_post_id text,
  author_username text,
  author_avatar text,
  text text,
  posted_at timestamptz,
  status text not null default 'unread' check (status in ('unread','replied','archived')),
  sentiment text check (sentiment in ('positive','neutral','negative')),
  reply_text text,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, external_comment_id)
);

create index if not exists ig_comments_user_status_idx
  on public.ig_comments (user_id, status, posted_at desc);

alter table public.ig_comments enable row level security;
create policy "ig_comments: own rows" on public.ig_comments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 5. saved_content_ideas — AI-generated content the user saved
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
create policy "ai_reports: own rows" on public.ai_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 7. trend_cache — cached trend discovery results per industry
-- ============================================================
create table if not exists public.trend_cache (
  id uuid primary key default uuid_generate_v4(),
  industry text not null,
  platform text not null check (platform in ('instagram','tiktok','all')),
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists trend_cache_lookup_idx
  on public.trend_cache (industry, platform, expires_at desc);

-- trend_cache is shared across users; no RLS (read-only via service role from API routes)

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
