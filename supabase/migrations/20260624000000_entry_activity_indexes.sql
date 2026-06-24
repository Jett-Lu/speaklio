alter table public.activities
add column if not exists metric_entry_id uuid references public.metric_entries(id) on delete cascade;

create index if not exists activities_user_occurred_at_idx
on public.activities (user_id, occurred_at desc);

create index if not exists activities_metric_entry_id_idx
on public.activities (metric_entry_id)
where metric_entry_id is not null;

create index if not exists metric_entries_user_occurred_at_idx
on public.metric_entries (user_id, occurred_at desc);

create index if not exists metric_entries_user_plugin_idx
on public.metric_entries (user_id, plugin_id);

create index if not exists metric_entries_user_entry_type_idx
on public.metric_entries (user_id, entry_type);
