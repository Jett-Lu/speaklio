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

## Local AI Strategy

The `local_ai/` parser is treated as a local development parser, not a database writer.

Current route:

```http
POST /ai/parse-command
```

This route:

- Requires authentication.
- Sends user text to local Ollama.
- Uses the `speaklio-parser` model by default.
- Validates the returned structured action shape.
- Returns parsed actions to the caller.
- Does not write to Supabase.

## Preview Before Write

AI output should not directly mutate database state in this phase.

Preferred flow:

```text
User text
-> POST /ai/parse-command
-> validated parsed actions
-> client shows preview or asks for confirmation
-> POST /entries or PATCH /entries/:id
```

This avoids storing incorrect model output without user review and keeps debugging simple.

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
- AI parsing is available to authenticated users but returns previews only.
- Activity timeline rows are not created automatically yet.

## Next Decisions

- Whether AI-confirmed actions should be saved through existing `/entries` routes or a dedicated `/ai/confirm-actions` route.
- Whether activities should be created in backend route handlers when entries are created.
- Which parsed action types need first-class domain tables later.
- Whether local AI remains development-only or becomes a pluggable provider behind a common parser interface.
