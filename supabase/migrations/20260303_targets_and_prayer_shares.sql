-- 전도 대상자 (사용자별 비공개)
create table if not exists public.targets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text not null,
  situation text not null,
  interest text not null,
  notes text null,
  status text not null default 'praying',
  prayer_dates text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_targets_user_created_at
  on public.targets (user_id, created_at desc);

alter table public.targets enable row level security;

drop policy if exists "targets_select_own" on public.targets;
create policy "targets_select_own"
on public.targets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "targets_insert_own" on public.targets;
create policy "targets_insert_own"
on public.targets
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "targets_update_own" on public.targets;
create policy "targets_update_own"
on public.targets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "targets_delete_own" on public.targets;
create policy "targets_delete_own"
on public.targets
for delete
to authenticated
using (auth.uid() = user_id);

-- 즐겨찾기 질문 (사용자별 비공개)
create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  category_id text not null,
  question_text text not null,
  saved_at bigint not null,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_favorites_user_saved_at
  on public.favorites (user_id, saved_at desc);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

-- 기도 나눔 (전체 공유)
create table if not exists public.prayer_shares (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  request text not null,
  author_name text null,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_prayer_shares_created_at
  on public.prayer_shares (created_at desc);

alter table public.prayer_shares enable row level security;

drop policy if exists "prayer_shares_select_authenticated" on public.prayer_shares;
create policy "prayer_shares_select_authenticated"
on public.prayer_shares
for select
to authenticated
using (true);

drop policy if exists "prayer_shares_insert_own" on public.prayer_shares;
create policy "prayer_shares_insert_own"
on public.prayer_shares
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prayer_shares_delete_own" on public.prayer_shares;
create policy "prayer_shares_delete_own"
on public.prayer_shares
for delete
to authenticated
using (auth.uid() = user_id);

-- 함께 기도(좋아요 유사) 매핑
create table if not exists public.prayer_share_prayers (
  share_id bigint not null references public.prayer_shares(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (share_id, user_id)
);

create index if not exists idx_prayer_share_prayers_share_id
  on public.prayer_share_prayers (share_id);

alter table public.prayer_share_prayers enable row level security;

drop policy if exists "prayer_share_prayers_select_authenticated" on public.prayer_share_prayers;
create policy "prayer_share_prayers_select_authenticated"
on public.prayer_share_prayers
for select
to authenticated
using (true);

drop policy if exists "prayer_share_prayers_insert_own" on public.prayer_share_prayers;
create policy "prayer_share_prayers_insert_own"
on public.prayer_share_prayers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prayer_share_prayers_delete_own" on public.prayer_share_prayers;
create policy "prayer_share_prayers_delete_own"
on public.prayer_share_prayers
for delete
to authenticated
using (auth.uid() = user_id);

-- 전체 대상자 수 (count만 공개)
create or replace function public.get_total_targets_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_count integer := 0;
begin
  if to_regclass('public.targets') is null then
    return 0;
  end if;

  execute 'select count(*) from public.targets' into total_count;
  return coalesce(total_count, 0);
end;
$$;

revoke all on function public.get_total_targets_count() from public;
grant execute on function public.get_total_targets_count() to authenticated;

