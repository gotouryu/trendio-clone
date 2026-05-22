-- ============================================================
-- 2026-05-22: AI台本生成の月間利用上限
-- ============================================================
-- 目的:
-- - Gemini APIの従量課金暴走を防ぐため、ユーザーごと・月ごとの生成回数をDBで管理する。
-- - API route は Gemini を呼ぶ前に consume_ai_content_monthly_quota() を実行する。
-- - 20回到達後はDB側で allowed=false を返し、Gemini を呼ばない。

create extension if not exists "uuid-ossp";

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

notify pgrst, 'reload schema';
