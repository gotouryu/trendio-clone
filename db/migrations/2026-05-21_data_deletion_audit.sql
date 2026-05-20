-- 2026-05-21 Meta Data Deletion Callback の監査テーブル
-- Meta から /api/meta/data-deletion に signed_request が POST された時、
-- confirmation_code + meta_user_id + requested_at を残しておき、
-- Meta が後で問い合わせた場合に追跡できるようにする。

create table if not exists public.data_deletion_requests (
  id uuid primary key default uuid_generate_v4(),
  confirmation_code text not null unique,
  meta_user_id text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

create index if not exists data_deletion_requests_meta_user_idx
  on public.data_deletion_requests (meta_user_id);

create index if not exists data_deletion_requests_requested_at_idx
  on public.data_deletion_requests (requested_at desc);

-- 監査用テーブル = RLS off(=Service Role からのみ書き込み)
-- Karteia のお客様には見せない
alter table public.data_deletion_requests enable row level security;

drop policy if exists "data_deletion_requests: service only" on public.data_deletion_requests;
create policy "data_deletion_requests: service only" on public.data_deletion_requests
  for all using (false) with check (false);
