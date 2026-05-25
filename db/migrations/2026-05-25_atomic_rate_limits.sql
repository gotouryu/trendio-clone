-- ============================================================
-- 2026-05-25: atomic rate-limit counters
-- ============================================================
-- Fixes read-then-update races under parallel requests.

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
