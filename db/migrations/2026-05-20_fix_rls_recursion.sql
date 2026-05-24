-- 2026-05-20 RLS無限再帰バグ修正
-- 問題:profiles テーブルの RLS ポリシーが「ポリシー内で profiles を SELECT する」構造になっており、
--      PostgreSQL で無限再帰 → 500 エラー → 管理者ログインができない状態だった
-- 対策:is_admin(uid) SECURITY DEFINER 関数で判定をテーブル外に切り出す
-- 影響:profiles SELECT/UPDATE、login_events SELECT の3ポリシーを書き換え

-- 1. is_admin 関数(=SECURITY DEFINER でRLSバイパス、無限再帰なし)
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

-- 2. profiles SELECT ポリシー差し替え
drop policy if exists "profiles: own row or admin read" on public.profiles;
create policy "profiles: own row or admin read"
  on public.profiles for select using (
    auth.uid() = id
    or public.is_admin(auth.uid())
  );

-- 3. profiles UPDATE(admin)ポリシー差し替え
drop policy if exists "profiles: admin can update any" on public.profiles;
create policy "profiles: admin can update any"
  on public.profiles for update using (
    public.is_admin(auth.uid())
  );

-- 4. login_events SELECT ポリシー差し替え
drop policy if exists "login_events: select own or admin" on public.login_events;
create policy "login_events: select own or admin"
  on public.login_events for select using (
    auth.uid() = user_id
    or public.is_admin(auth.uid())
  );

-- 検証クエリ(=実行後に結果を確認):
-- (a) 関数が登録されているか
--     select proname, prosrc from pg_proc where proname = 'is_admin';
-- (b) ポリシーが新しい定義になっているか
--     select polname, pg_get_expr(polqual, polrelid) from pg_policy where polname like '%admin%';
-- (c) 自分の role を確認(=管理者ログインのテスト)
--     select id, company_name, role, status from public.profiles where id = auth.uid();
