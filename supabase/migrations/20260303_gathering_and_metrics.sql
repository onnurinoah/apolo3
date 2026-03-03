-- Admin 이메일 화이트리스트
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

grant select on public.admin_emails to authenticated;

-- 집회 초대 폼 노출 설정 (단일 row)
create table if not exists public.gathering_config (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default false,
  event_name text not null default '',
  event_date date null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.gathering_config (id, is_open, event_name, event_date)
values (1, false, '', null)
on conflict (id) do nothing;

alter table public.gathering_config enable row level security;

drop policy if exists "gathering_config_select_authenticated" on public.gathering_config;
create policy "gathering_config_select_authenticated"
on public.gathering_config
for select
to authenticated
using (true);

drop policy if exists "gathering_config_admin_write" on public.gathering_config;
create policy "gathering_config_admin_write"
on public.gathering_config
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_emails a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1
    from public.admin_emails a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  )
);

-- 집회 초대/결신 등록
create table if not exists public.gathering_submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  event_date date null,
  invitee_name text null,
  invite_count integer not null check (invite_count > 0),
  phone text null,
  prayer_request text not null,
  agreed_privacy boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_gathering_submissions_created_at
  on public.gathering_submissions (created_at desc);

alter table public.gathering_submissions enable row level security;

drop policy if exists "gathering_submissions_insert_own" on public.gathering_submissions;
create policy "gathering_submissions_insert_own"
on public.gathering_submissions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "gathering_submissions_select_own" on public.gathering_submissions;
create policy "gathering_submissions_select_own"
on public.gathering_submissions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "gathering_submissions_admin_select_all" on public.gathering_submissions;
create policy "gathering_submissions_admin_select_all"
on public.gathering_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_emails a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  )
);

-- 전체 전도대상자 수 카운트 함수 (RLS 우회, count만 공개)
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

