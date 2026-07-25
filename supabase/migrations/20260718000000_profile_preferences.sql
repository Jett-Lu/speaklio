alter table public.profiles
add column if not exists personal_data jsonb not null default '{}'::jsonb,
add column if not exists goals jsonb not null default '{}'::jsonb,
add column if not exists preferences jsonb not null default '{}'::jsonb;
