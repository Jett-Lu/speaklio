create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  timezone text default 'America/Toronto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plugins (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_plugins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plugin_id text not null references public.plugins(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, plugin_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plugin_id text references public.plugins(id) on delete set null,
  title text not null,
  detail text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plugin_id text references public.plugins(id) on delete set null,
  entry_type text not null,
  value numeric,
  unit text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name'),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.plugins enable row level security;
alter table public.user_plugins enable row level security;
alter table public.activities enable row level security;
alter table public.metric_entries enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
on public.profiles for delete
using ((select auth.uid()) = id);

create policy "Anyone can view active plugins"
on public.plugins for select
using (is_active = true);

create policy "Users can view their own plugin settings"
on public.user_plugins for select
using ((select auth.uid()) = user_id);

create policy "Users can create their own plugin settings"
on public.user_plugins for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update their own plugin settings"
on public.user_plugins for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own plugin settings"
on public.user_plugins for delete
using ((select auth.uid()) = user_id);

create policy "Users can view their own activities"
on public.activities for select
using ((select auth.uid()) = user_id);

create policy "Users can create their own activities"
on public.activities for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update their own activities"
on public.activities for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own activities"
on public.activities for delete
using ((select auth.uid()) = user_id);

create policy "Users can view their own metric entries"
on public.metric_entries for select
using ((select auth.uid()) = user_id);

create policy "Users can create their own metric entries"
on public.metric_entries for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update their own metric entries"
on public.metric_entries for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own metric entries"
on public.metric_entries for delete
using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.plugins to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_plugins to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, update, delete on public.metric_entries to authenticated;
