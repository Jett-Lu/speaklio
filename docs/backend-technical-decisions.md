# Backend Technical Decisions

Status: active working decisions

Last updated: 2026-06-23

## Backend Shape

Speaklio uses an Express + TypeScript backend for privileged server workflows.

Supabase remains the source of truth for:

- Auth users.
- Postgres data.
- Row Level Security.
- Local and cloud database migrations.

The backend verifies Supabase access tokens on protected routes and uses the Supabase secret key only on the server.

## Auth Boundary

Clients should call Supabase Auth directly for signup, signin, signout, token refresh, and password reset.

The backend should not manage passwords.

Protected backend routes require:

```http
Authorization: Bearer <supabase-access-token>
```

## CRUD Strategy

The first CRUD surface uses the existing `metric_entries` table.

This keeps early development flexible while the product model is still changing. We can later split high-value domains into dedicated tables such as:

- `workouts`
- `meals`
- `weight_logs`
- `weight_goals`
- `sleep_sessions`

Current CRUD route group:

```http
GET /entries
POST /entries
GET /entries/:id
PATCH /entries/:id
DELETE /entries/:id
```

All entry operations are scoped to the authenticated user.

API fields use camelCase. Database columns remain snake_case.

`GET /entries` supports `pluginId`, `entryType`, `from`, `to`, `limit`, and `offset`.

`POST /entries` creates a matching `activities` row as a timeline item. Activities now carry a nullable `metric_entry_id`, so deleting a metric entry also deletes its related activity through database cascade behavior.

The first validation pass is intentionally lightweight:

- Weight logs require a numeric value and `kg` or `lb`.
- Calorie logs require a numeric value and use `cal`.
- Workout logs require `metadata.exercise`.
- Food logs require `metadata.food`.

More detailed domain validation can be added once the frontend shapes settle.

## Plugin Settings

Plugin visibility and enabled state are handled separately.

`plugins` stores available modules. `user_plugins` stores a user's enabled or disabled state.

Current plugin route group:

```http
GET /plugins
PUT /plugins/:pluginId/enable
DELETE /plugins/:pluginId/enable
```

This supports dashboard modules without making third-party plugin development part of the capstone scope.

## Local AI Strategy

The `local_ai/` parser is treated as a local development parser, not a database writer.

Current route group:

```http
POST /ai/parse-command
POST /ai/preview-entry
POST /ai/confirm-actions
```

These routes:

- Require authentication.
- Sends user text to local Ollama.
- Uses the `speaklio-parser` model by default.
- Validates the returned structured action shape.
- Returns parsed actions and preview payloads before writing.
- Writes to Supabase only after the caller confirms reviewed entry payloads.

## Preview Before Write

AI output should not directly mutate database state in this phase.

Preferred flow:

```text
User text
-> POST /ai/parse-command
-> validated parsed actions
-> POST /ai/preview-entry
-> client shows reviewed entry payloads
-> POST /ai/confirm-actions
```

This avoids storing incorrect model output without user review and keeps debugging simple.

`POST /ai/confirm-actions` creates metric entries and matching activity rows. It exists so the AI flow can evolve separately from generic CRUD if confirmation later needs additional metadata, confidence handling, or audit behavior.

Unsupported AI actions are returned as preview items with `entry: null` and a reason. They are not saved by the confirm route unless the client supplies a valid entry payload.

## Account Deletion

The current capstone behavior is immediate hard deletion through Supabase Auth admin:

```http
DELETE /me
```

Related database rows cascade from the user/profile relationships and entry/activity links. This is simple and demo-friendly, but a production app may want delayed deletion, export, or recovery behavior.

## Environment Variables

Server-side:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `LOCAL_AI_URL`
- `LOCAL_AI_MODEL`

Client-safe:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Do not expose `SUPABASE_SECRET_KEY` in frontend or mobile code.

## Current Tradeoffs

- Generic `metric_entries` trades strict domain modeling for speed and flexibility.
- Local AI depends on Ollama running on each developer machine.
- AI parsing is available to authenticated users and requires explicit confirmation before writes.
- Activity timeline rows are created automatically for manual entries and AI-confirmed entries.

## Next Decisions

- Which parsed action types need first-class domain tables later.
- Whether local AI remains development-only or becomes a pluggable provider behind a common parser interface.
- Whether activities should become directly editable/deletable or stay derived from entries.
- How strict confirm-time validation should become for each entry type.
