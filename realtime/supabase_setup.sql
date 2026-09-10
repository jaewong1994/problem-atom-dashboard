-- Problem Atom 전용 Supabase 프로젝트의 SQL Editor에서 한 번 실행합니다.
-- 다른 운영 프로젝트에는 실행하지 않습니다.

create table if not exists public.pa_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  updated_at timestamptz not null default now()
);

create table if not exists public.pa_question_claims (
  question_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null check (char_length(owner_name) between 1 and 20),
  status text not null default 'claimed' check (status in ('claimed', 'completed')),
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_id, owner_id)
);

create index if not exists pa_question_claims_question_id_idx
  on public.pa_question_claims (question_id);

alter table public.pa_members enable row level security;
alter table public.pa_question_claims enable row level security;

grant select, insert, update on public.pa_members to authenticated;
grant select, insert, update, delete on public.pa_question_claims to authenticated;

create table if not exists public.pa_asset_comments (
  comment_id uuid primary key default gen_random_uuid(),
  asset_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null check (char_length(owner_name) between 1 and 20),
  kind text not null check (kind in ('addition', 'correction', 'question')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pa_asset_comments_asset_id_idx
  on public.pa_asset_comments (asset_id, created_at);

alter table public.pa_asset_comments enable row level security;
grant select, insert, update, delete on public.pa_asset_comments to authenticated;

drop policy if exists "members read own" on public.pa_members;
create policy "members read own" on public.pa_members for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "members insert own" on public.pa_members;
create policy "members insert own" on public.pa_members for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "members update own" on public.pa_members;
create policy "members update own" on public.pa_members for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "claims team read" on public.pa_question_claims;
create policy "claims team read" on public.pa_question_claims for select to authenticated
using (auth.uid() is not null);

drop policy if exists "claims insert own" on public.pa_question_claims;
create policy "claims insert own" on public.pa_question_claims for insert to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "claims update own" on public.pa_question_claims;
create policy "claims update own" on public.pa_question_claims for update to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "claims delete own" on public.pa_question_claims;
create policy "claims delete own" on public.pa_question_claims for delete to authenticated
using (auth.uid() = owner_id);

drop policy if exists "comments team read" on public.pa_asset_comments;
create policy "comments team read" on public.pa_asset_comments for select to authenticated
using (auth.uid() is not null);

drop policy if exists "comments insert own" on public.pa_asset_comments;
create policy "comments insert own" on public.pa_asset_comments for insert to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "comments update own" on public.pa_asset_comments;
create policy "comments update own" on public.pa_asset_comments for update to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "comments delete own" on public.pa_asset_comments;
create policy "comments delete own" on public.pa_asset_comments for delete to authenticated
using (auth.uid() = owner_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pa_question_claims'
  ) then
    alter publication supabase_realtime add table public.pa_question_claims;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pa_asset_comments'
  ) then
    alter publication supabase_realtime add table public.pa_asset_comments;
  end if;
end $$;
