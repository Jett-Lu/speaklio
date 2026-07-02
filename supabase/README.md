# Speaklio Supabase

This directory contains the local Supabase project config, database migrations, and seed data for Speaklio.

## Contents

- `config.toml` - local Supabase project configuration.
- `migrations/` - tracked database schema changes.
- `seed.sql` - default plugin catalog data.

## Local Workflow

From the repo root:

```powershell
npm run supabase:start
npm run supabase:status
npm run supabase:db:reset
```

`supabase:db:reset` recreates the local database, applies all migrations, and runs `seed.sql`.

## Current Migrations

- `20260610000000_initial_schema.sql` - profiles, plugins, user plugin settings, activities, metric entries, RLS policies, and profile creation trigger.
- `20260624000000_entry_activity_indexes.sql` - activity-to-entry link plus indexes for common activity and metric entry queries.

## Cloud Workflow

After linking to the shared Supabase project, push migrations with:

```powershell
npm run supabase:db:push
```

Seed the shared plugin catalog only when the remote project is missing the default plugin rows:

```powershell
npm run supabase:seed:remote
```

Do not commit local `.env` files, database passwords, service role keys, or generated Supabase runtime files.
