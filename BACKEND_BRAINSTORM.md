# Speaklio Backend Brainstorm

Temporary working notes for planning the backend. This can be deleted, renamed, or folded into a formal architecture document later.

Last updated: 2026-06-10

## Current App Reality

- The app is currently a static prototype in `frontend/`: `index.html`, `styles.css`, `app.js`, and `server.js`.
- All user data lives in browser `localStorage`.
- The assistant is offline and rule-based.
- The frontend will likely be rewritten, so backend decisions should stay framework-agnostic for now.

## Backend Goals

- Add real user accounts.
- Persist dashboard/profile/plugin/activity data outside the browser.
- Keep a clean migration path from demo data to real data.
- Support personal tracking first, with room to add sharing later.
- Make third-party accounts and services group-owned or group-accessible.
- Avoid coupling the backend to the current frontend implementation.
- Keep the scope realistic for a capstone: useful, demonstrable, and maintainable.

## Supabase Fit

Supabase looks like a strong candidate because it gives us:

- Auth for email/password, magic links, OAuth, and other flows.
- PostgreSQL as the primary database.
- Row Level Security for per-user access control.
- Storage if we later need avatars, audio uploads, documents, or plugin assets.
- Edge Functions if we need server-side logic without running our own backend server.
- Local development through the Supabase CLI and Docker.

Useful docs:

- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase access control: https://supabase.com/docs/guides/platform/access-control
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase local development: https://supabase.com/docs/guides/local-development

## Group Ownership Rules

Because this is a group capstone, no critical integration should be tied only to one person.

Suggested rule:

- Create a shared Supabase organization for the project.
- Add at least two owners/admins immediately.
- Use a shared school/team email where possible for billing, recovery, and service notifications.
- Store project credentials in a shared password manager or approved team secret vault.
- Document who has access and what role they have.
- Never commit service role keys, database passwords, or OAuth client secrets.

Supabase-specific note:

- Supabase organizations support members and roles.
- Each organization must have at least one owner.
- A project owner should invite another owner/admin before leaving or transferring responsibility.

## Recommended Architecture Direction

Planning assumption: use Supabase as the backend platform for auth/database, plus a small Express + TypeScript backend for privileged app logic.

Keep the frontend choice flexible. The current static frontend may later become a web app, mobile app, or both.

Phase 1:

- Frontend can talk directly to Supabase using the anon/publishable key for ordinary user-owned data.
- Frontend calls the Node backend for privileged workflows.
- Database tables use Row Level Security.
- No service role key in browser or mobile app code.
- Keep localStorage only as a demo fallback or migration helper.

Phase 2:

- Expand the Node backend for actions that should not run in the browser/mobile app.
- Examples: AI assistant calls, audio transcription workflows, webhooks, secrets, and scheduled summaries.

Phase 3:

- If the backend grows, split long-running/background work out of the request/response API.
- Possible options: background worker, queue, cron jobs, or selected Supabase Edge Functions.
- Add user-to-user sharing only after the single-user data model is stable.

## Future Mobile App Direction

If Speaklio becomes a mobile app, the Supabase backend can stay in place.

Recommended mobile-friendly stack:

- Expo + React Native + TypeScript for the app.
- Supabase Auth/Postgres/RLS for accounts and user data.
- A Node backend for privileged app logic if the team wants a dedicated backend server.
- Shared validation/types between mobile and backend where practical.

If we choose a dedicated backend server, prefer:

- Express + TypeScript for HTTP APIs, because the team is most comfortable with it.
- Zod or similar validation for request/response shapes.
- Supabase server-side client for privileged operations.
- No Supabase secret/service key in the mobile app.

The mobile app can still call Supabase directly for ordinary user-owned data, while calling our backend for:

- AI/LLM requests.
- Audio transcription orchestration.
- Any endpoint that needs secret API keys.
- Account deletion or admin-like workflows.
- Integrations and webhooks.

Supabase Edge Functions can also handle many of these jobs, but they are Deno/TypeScript serverless functions rather than an Express/Fastify app. They are best for small, stateless endpoints and integrations.

Current planning assumption:

- We are not investigating Expo deeply right now.
- Assume a small Express + TypeScript backend plus Supabase.
- Keep mobile compatibility in mind without designing the mobile app yet.

## Initial Data Model Ideas

These tables are intentionally simple and can evolve.

### `profiles`

One row per auth user.

- `id uuid primary key references auth.users(id)`
- `display_name text`
- `email text`
- `avatar_url text`
- `timezone text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `plugins`

Catalog of available Speaklio modules.

- `id text primary key`
- `name text`
- `description text`
- `icon text`
- `is_active boolean`
- `created_at timestamptz`

### `user_plugins`

Which plugins a user has enabled.

- `user_id uuid references auth.users(id)`
- `plugin_id text references plugins(id)`
- `enabled boolean`
- `created_at timestamptz`
- Primary key: `(user_id, plugin_id)`

For now, plugins are dashboard modules controlled by the Speaklio team. Third-party plugin development is out of scope.

### `activities`

Timeline/history entries.

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `plugin_id text references plugins(id)`
- `title text`
- `detail text`
- `occurred_at timestamptz`
- `created_at timestamptz`

### `metric_entries`

Generic event table for logged health/finance/workout/sleep data.

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `plugin_id text references plugins(id)`
- `entry_type text`
- `value numeric`
- `unit text`
- `metadata jsonb`
- `occurred_at timestamptz`
- `created_at timestamptz`

This keeps early development flexible without designing six perfect schemas too soon.

Later, split high-value domains into dedicated tables if needed:

- `meals`
- `expenses`
- `sleep_sessions`
- `workouts`
- `hydration_logs`
- `mindfulness_sessions`

## Future Sharing Model

Speaklio should start as personal tracking, where each row belongs to one user.

If sharing becomes part of the app later, avoid changing every table. Add sharing with a separate permission model, such as:

- `connections`
- `shared_profiles`
- `shared_plugin_access`

Possible roles later:

- `viewer`
- `coach`
- `caregiver`

Do not build this yet unless it becomes a capstone requirement.

## Auth Approach

Start with:

- Email/password or magic link.
- Optional OAuth only if it helps demo value.
- Profile row created on signup.
- Authenticated users can only read/write their own user-owned rows.

Potential capstone-friendly auth flow:

- Sign up
- Sign in
- Sign out
- Edit profile
- Delete account
- Delete individual log entries
- Export user data if time allows

## RLS Policy Direction

Enable RLS on all exposed user-data tables.

Basic policy shape:

- Users can select their own rows where `user_id = auth.uid()`.
- Users can insert rows only for themselves.
- Users can update/delete only their own rows.
- Public plugin catalog can be readable by authenticated users, possibly anonymous users too.

Important:

- Service role keys bypass RLS and must stay server-side only.
- RLS should be tested early, not at the end.

## Privacy And Deletion Direction

Recommended stance:

- Users should be able to delete their account.
- Users should be able to delete individual log entries they created.
- Activity timeline rows should either be deleted with the source log entry or clearly treated as derived history.
- Profile data should be deleted or anonymized when the account is deleted.
- Audio recordings should not be stored by default unless the feature needs playback/history.
- Audio recordings should be treated as transient input for LLM/transcription requests.
- If audio is ever stored later, it should require an explicit feature reason, retention policy, and delete path.
- AI request/response history should be user-visible if stored, and deletable.

For the capstone, the practical minimum is:

- Delete account.
- Delete activity/log entries.
- Do not store raw audio for the initial LLM query flow.

## Development Workflow

Suggested repo additions later:

- `supabase/`
- `supabase/migrations/`
- `supabase/seed.sql`
- `.env.example`
- Docs for local setup.

Suggested local workflow:

- Install Supabase CLI as a dev dependency.
- Use Docker for local Supabase.
- Track schema changes as migrations.
- Seed plugin catalog data.
- Generate TypeScript types if/when the frontend is rewritten in TypeScript.

## Environment Variables

Browser-safe:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` or publishable key equivalent

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- AI provider keys
- OAuth client secrets
- webhook secrets

## Backend Questions To Decide

- Should account deletion be immediate hard delete, delayed deletion, or anonymization plus deletion?
- Should log deletion remove associated activity rows, or leave anonymized timeline history?
- Do we need to store text transcripts, or should transcripts be transient too unless they become structured log entries?
- Should AI conversation history be stored, or should the assistant only write structured log entries?
- Which frontend framework will replace the prototype?
- What is the first backend slice we want to demo to graders?

## Decisions So Far

- Start with personal tracking.
- Keep future sharing possible, but do not build it yet.
- Plugins are first-party dashboard modules only.
- Manual logs are enough for nutrition, finance, health, and wellness at the start.
- Browser/app audio recording and real AI calls are planned, but likely owned by a teammate later.
- Audio should not be stored for the initial LLM flow; it should only be used transiently for queries/transcription.
- Accounts should be deletable.
- Most user-created log entries should be deletable.
- The goal is to get as close as possible to a working app over time, but today's task is planning.

## Suggested First Backend Milestone

Build the smallest real backend slice:

- Shared Supabase organization created.
- Project members invited.
- Supabase local dev initialized.
- `profiles`, `plugins`, `user_plugins`, `activities`, and `metric_entries` migrations created.
- RLS policies added.
- Seed default plugins.
- Frontend can sign up, sign in, sign out.
- Frontend can sync enabled plugins and activity timeline.
- Frontend can create and delete at least one kind of log entry.
- Account deletion path is designed, even if not fully implemented in the first pass.

## Parking Lot

- Real AI assistant integration.
- Audio recording uploads.
- Transient audio-to-LLM/transcription pipeline.
- Optional transcript retention policy if conversation history becomes a feature.
- Push notifications.
- HealthKit/Google Fit integration.
- Plaid or finance API integration.
- Team/caregiver sharing.
- Admin dashboard.
- Analytics/events.
