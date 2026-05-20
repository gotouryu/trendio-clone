-- 2026-05-22 Phase 3 Wave-E:
-- 5体並列レビュー(Phase 2-A/B/C/E)で発見した DB 系 Critical/High を一括修正。
--
-- 反映内容:
--   1. bump_customer_aggregate に UPDATE 分岐追加(=Phase 2-A C2)
--   2. sns_accounts に meta_asid カラム追加(=Phase 2-B C1: ASID マッチング用)
--   3. auto_reply_logs.status CHECK 制約に skipped/duplicate 追加(=Phase 2-E M6)
--   4. customer_overview_v に notes カラム追加(=Phase 2-E M1)
--   5. 5年ログ保管ポリシーをコメントで明文化(=Phase 2-E C1)
--   6. data_deletion_requests の Service Role grant を明示(=Phase 2-A C1)
--   7. audit_log テーブル新設(=Phase 2-C M-2)

-- ============================================================
-- 1. bump_customer_aggregate に UPDATE 分岐追加
--    (=customer_id 変更時に元/新の counter を ±1 する)
-- ============================================================
create or replace function public.bump_customer_aggregate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.customers
       set total_interactions = total_interactions + 1,
           first_contact_at = coalesce(first_contact_at, new.created_at),
           last_contact_at = greatest(coalesce(last_contact_at, new.created_at), new.created_at),
           updated_at = now()
     where id = new.customer_id and user_id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update public.customers
       set total_interactions = greatest(0, total_interactions - 1),
           updated_at = now()
     where id = old.customer_id and user_id = old.user_id;
  elsif (tg_op = 'UPDATE' and old.customer_id is distinct from new.customer_id) then
    -- 元顧客から -1、新顧客に +1
    update public.customers
       set total_interactions = greatest(0, total_interactions - 1),
           updated_at = now()
     where id = old.customer_id and user_id = old.user_id;
    update public.customers
       set total_interactions = total_interactions + 1,
           last_contact_at = greatest(coalesce(last_contact_at, new.created_at), new.created_at),
           updated_at = now()
     where id = new.customer_id and user_id = new.user_id;
  end if;
  return null;
end;
$$;

drop trigger if exists customer_interactions_aggregate on public.customer_interactions;
drop trigger if exists bump_customer_aggregate_trg on public.customer_interactions;
create trigger bump_customer_aggregate_trg
  after insert or update or delete on public.customer_interactions
  for each row execute function public.bump_customer_aggregate();

-- ============================================================
-- 2. sns_accounts に meta_asid カラム追加
--    Meta Data Deletion Callback で渡される ASID(=App-Scoped User ID)を保存し、
--    削除リクエスト時に対象 user を確実に特定できるようにする。
-- ============================================================
alter table public.sns_accounts
  add column if not exists meta_asid text;

create index if not exists sns_accounts_meta_asid_idx
  on public.sns_accounts (meta_asid)
  where meta_asid is not null;

-- ============================================================
-- 3. auto_reply_logs.status CHECK 制約に skipped/duplicate 追加
--    processComment が skipped 状態でもログ INSERT を試みる仕様だが、
--    旧 CHECK 制約は ('sent','failed','blocked_ng') のみで 500 エラーになっていた。
-- ============================================================
alter table public.auto_reply_logs
  drop constraint if exists auto_reply_logs_status_check;
alter table public.auto_reply_logs
  add constraint auto_reply_logs_status_check
  check (status in ('sent','failed','blocked_ng','skipped','duplicate'));

-- ============================================================
-- 4. customer_overview_v に notes カラム追加
--    旧定義で notes が抜けていて、一覧 API と単体 API で値が違って見える問題を修正。
-- ============================================================
drop view if exists public.customer_overview_v;
create view public.customer_overview_v
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
  c.notes,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id
      and ci.category = 'product_inquiry') as product_inquiry_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id
      and ci.category = 'complaint') as complaint_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id
      and ci.category = 'positive') as positive_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id
      and ci.type = 'reply_auto') as auto_reply_count,
  c.created_at,
  c.updated_at
from public.customers c;

grant select on public.customer_overview_v to authenticated;

-- ============================================================
-- 5. 5年ログ保管ポリシーをコメントで明文化(=共P-01 必須要件)
--    自動削除トリガーを設けないことを明示。
--    バックアップ:Supabase Point-in-Time Recovery + 月次手動エクスポート。
-- ============================================================
comment on table public.auto_reply_logs is
  'Retention: 5 years (共P-01 IT導入補助金 必須要件). 自動削除トリガーは設けない。';
comment on table public.customer_interactions is
  'Retention: 5 years (共P-01 IT導入補助金 必須要件). 自動削除トリガーは設けない。';
comment on table public.ig_comments is
  'Retention: 5 years (共P-01 IT導入補助金 必須要件). 自動削除トリガーは設けない。';
comment on table public.ai_reports is
  'Retention: 5 years (共P-01 IT導入補助金 必須要件). 自動削除トリガーは設けない。';

-- ============================================================
-- 6. data_deletion_requests の Service Role grant 明示
-- ============================================================
revoke all on table public.data_deletion_requests from anon, authenticated;
-- service_role は postgres ロールで動作するので、grant 不要(=RLS バイパス)
-- ただし明示的に他ロールへの権限を取り除く

-- ============================================================
-- 7. audit_log テーブル新設(=管理者操作の追跡)
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  payload jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_actor_created_idx
  on public.audit_log (actor_user_id, created_at desc);
create index if not exists audit_log_action_created_idx
  on public.audit_log (action, created_at desc);

alter table public.audit_log enable row level security;
drop policy if exists "audit_log: admin read only" on public.audit_log;
create policy "audit_log: admin read only" on public.audit_log
  for select using (public.is_admin(auth.uid()));

comment on table public.audit_log is
  'Retention: 5 years (共P-01 IT導入補助金 必須要件). 管理者操作の追跡。';

-- ============================================================
-- 検証クエリ(=実行後手動チェック):
--   select tgname, tgtype from pg_trigger where tgrelid = 'public.customer_interactions'::regclass;
--   select pg_get_function_arguments(oid), prosrc from pg_proc where proname = 'bump_customer_aggregate';
--   select column_name from information_schema.columns where table_name = 'sns_accounts' and column_name = 'meta_asid';
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'auto_reply_logs_status_check';
--   select column_name from information_schema.columns where table_name = 'customer_overview_v' and column_name = 'notes';
