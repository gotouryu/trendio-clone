-- 2026-05-20 セキュリティ強化マイグレーション(5体並列レビュー指摘の Critical/High 群を解消)
-- 対象:
--   Critical: handle_new_user self-admin 昇格 / customer_usage ビュー漏洩 / is_admin の anon grant / auto_reply_logs の UNIQUE / customer_interactions 所有チェック
--   High:    customer_overview_v サブクエリ user_id / bump_customer_aggregate の SECURITY DEFINER + user_id / ビュー grant 明示

-- ============================================================
-- 1. Critical: handle_new_user の self-admin 昇格を封鎖
--    user_metadata.role を信用しない=新規登録は必ず customer 固定
--    admin 昇格は Service Role(=管理画面)経由でのみ可能
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'company_name',
    'customer'  -- ← user_metadata の role は無視、必ず customer
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- 2. Critical: customer_usage ビューに security_invoker を付与
--    デフォルトの security_definer のままだと anon でも全顧客情報を read 可能
-- ============================================================
-- 既存ビュー定義を維持したまま security_invoker を追加(=alter で属性のみ変更)
alter view if exists public.customer_usage set (security_invoker = true);
-- もし alter で属性変更が効かない PostgreSQL バージョン用フォールバック:
-- 既存定義を維持しつつ create or replace
-- (本番DBが PG15+ なので alter で OK のはず。失敗したらこのファイルを2分割)

-- ============================================================
-- 3. Critical: is_admin(uuid) の anon grant を取り消す
--    anon から is_admin 関数を叩けると admin UUID 列挙の踏み台になる
-- ============================================================
revoke execute on function public.is_admin(uuid) from anon;
-- authenticated / service_role には残す(=ポリシー評価で必要)

-- ============================================================
-- 4. Critical: auto_reply_logs に部分 UNIQUE インデックス
--    並行発火(=Webhook 二重発火等)で同一 comment_id が2回 INSERT されるのを DB 側でブロック
-- ============================================================
create unique index if not exists auto_reply_logs_unique_processed_comment
  on public.auto_reply_logs (user_id, comment_id)
  where status in ('sent', 'blocked_ng');

-- ============================================================
-- 5. Critical+High: customer_interactions の所有整合性をトリガーで強制
--    customer_interactions.user_id と customers.user_id が一致することを INSERT/UPDATE 前に検証
-- ============================================================
create or replace function public.ensure_customer_interaction_owner()
returns trigger
language plpgsql
security invoker
as $$
begin
  if not exists (
    select 1 from public.customers c
    where c.id = new.customer_id and c.user_id = new.user_id
  ) then
    raise exception 'customer_interactions.user_id does not match customers.user_id (customer_id=%, user_id=%)',
      new.customer_id, new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists customer_interactions_owner_check on public.customer_interactions;
create trigger customer_interactions_owner_check
  before insert or update on public.customer_interactions
  for each row execute function public.ensure_customer_interaction_owner();

-- ============================================================
-- 6. High: bump_customer_aggregate を SECURITY DEFINER + user_id 条件追加
--    他テナント顧客の集計改ざんを防ぐ
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
           last_contact_at = greatest(coalesce(last_contact_at, new.occurred_at), new.occurred_at),
           updated_at = now()
     where id = new.customer_id and user_id = new.user_id;  -- ← user_id 条件追加
  elsif (tg_op = 'DELETE') then
    update public.customers
       set total_interactions = greatest(0, total_interactions - 1),
           updated_at = now()
     where id = old.customer_id and user_id = old.user_id;  -- ← user_id 条件追加
  end if;
  return null;
end;
$$;
-- 既存トリガーは drop して INSERT+DELETE 両対応に再作成
drop trigger if exists bump_customer_aggregate_trg on public.customer_interactions;
create trigger bump_customer_aggregate_trg
  after insert or delete on public.customer_interactions
  for each row execute function public.bump_customer_aggregate();

-- ============================================================
-- 7. High: customer_overview_v のサブクエリに user_id 条件を追加
--    customer_id の理論的衝突時に他人の集計が混ざるリスクを排除
-- ============================================================
-- 既存ビュー定義を完全に drop してから再作成(=カラム順/型の差異で create or replace が失敗する PostgreSQL 制約への対応)
-- CASCADE は付けない(=もし他オブジェクトが依存しているなら、その時点で警告が出る方が安全)
drop view if exists public.customer_overview_v;
create view public.customer_overview_v
with (security_invoker = true)
as
select
  c.*,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id) as total_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id and ci.category = 'inquiry') as inquiry_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id and ci.category = 'order') as order_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id and ci.category = 'complaint') as complaint_count,
  (select count(*) from public.customer_interactions ci
    where ci.customer_id = c.id and ci.user_id = c.user_id and ci.category = 'praise') as praise_count
from public.customers c;

-- ============================================================
-- 8. High: ビューへの明示 grant(=ドキュメント化)
-- ============================================================
grant select on public.customer_overview_v to authenticated;
grant select on public.customer_usage to authenticated;

-- ============================================================
-- 検証クエリ(=実行後、結果を目視確認):
-- (a) handle_new_user が 'customer' 固定になっているか
--     select prosrc from pg_proc where proname = 'handle_new_user';
-- (b) customer_usage が security_invoker か
--     select relname, reloptions from pg_class where relname = 'customer_usage';
-- (c) is_admin の anon grant が解除されているか
--     select grantee, privilege_type from information_schema.routine_privileges
--      where routine_name = 'is_admin';
-- (d) auto_reply_logs の UNIQUE インデックス
--     select indexname, indexdef from pg_indexes
--      where tablename = 'auto_reply_logs' and indexname = 'auto_reply_logs_unique_processed_comment';
-- (e) customer_interactions のトリガー
--     select tgname from pg_trigger where tgrelid = 'public.customer_interactions'::regclass;
