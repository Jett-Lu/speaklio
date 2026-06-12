insert into public.plugins (id, name, description, icon)
values
  ('nutrition', 'Nutrition', 'Track meals, calories, and daily macros.', 'apple'),
  ('finance', 'Finance', 'Log expenses and keep an eye on your budget.', 'wallet'),
  ('sleep', 'Sleep', 'Understand your rest and sleep patterns.', 'moon'),
  ('workout', 'Workout', 'Plan sessions and follow your weekly progress.', 'bolt'),
  ('hydration', 'Hydration', 'Stay consistent with your daily water goal.', 'droplet'),
  ('mindfulness', 'Mindfulness', 'Make space for calm moments in your day.', 'heart')
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  is_active = true;
