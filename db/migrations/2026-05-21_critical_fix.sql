-- 2026-05-21 5体並列レビュー 2nd round で発見された Critical 3件の即修正
-- 直前の 2026-05-20_security_hardening.sql が以下の誤りを含んでいた:
--   (1) `new.occurred_at` 参照(=実カラム名は `created_at`)→ customer_interactions INSERT 全て 500 エラー
--   (2) `customer_overview_v` の category 値が schema CHECK 制約と乖離(='inquiry/order/praise' vs 'product_inquiry/...') → 集計永久 0
--   (3) 新トリガーが `first_contact_at` を更新しない(=旧定義の coalesce が消えた) → 初回接触日 NULL
--   + High: 旧トリガー `customer_interactions_aggregate` が drop されず → 二重発火で counter +2

-- ============================================================
-- 1. bump_customer_aggregate を正しい列名 + first_contact_at coalesce 復活で書き換え
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
  end if;
  return null;
end;
$$;

-- ============================================================
-- 2. 旧 trigger `customer_interactions_aggregate` を確実に drop してから
--    新 trigger `bump_customer_aggregate_trg` を1本だけ立てる(=二重発火防止)
-- ============================================================
drop trigger if exists customer_interactions_aggregate on public.customer_interactions;
drop trigger if exists bump_customer_aggregate_trg on public.customer_interactions;
create trigger bump_customer_aggregate_trg
  after insert or delete on public.customer_interactions
  for each row execute function public.bump_customer_aggregate();

-- ============================================================
-- 3. customer_overview_v を schema CHECK と整合する集計列に戻す
--    + サブクエリに `ci.user_id = c.user_id` 条件を追加(=2nd round 正しい修正)
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
-- 4. auto_reply_settings の race condition 対策(=user_id UNIQUE で upsert 可能化)
--    schema 上は user_id PRIMARY KEY だが明示的に upsert 経路を確認
-- ============================================================
-- user_id は既に PRIMARY KEY = 暗黙の UNIQUE 制約あり → API 側で upsert(onConflict: user_id) に統一すればOK
-- このマイグレーションでは DB 側変更不要

-- ============================================================
-- 検証クエリ(=実行後):
-- (a) trigger は 1本だけか
--     select tgname from pg_trigger where tgrelid = 'public.customer_interactions'::regclass and not tgisinternal;
-- (b) bump_customer_aggregate 関数本体に first_contact_at が含まれるか
--     select prosrc from pg_proc where proname = 'bump_customer_aggregate';
-- (c) customer_overview_v に product_inquiry_count 等が含まれるか
--     select column_name from information_schema.columns where table_name = 'customer_overview_v';
