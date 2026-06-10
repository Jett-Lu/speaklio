# Speaklio Backend

This is the Speaklio backend service. It is an Express + TypeScript API for workflows that should not run directly in the browser or a future mobile app.

## Stack

- Node.js 24+
- Express
- TypeScript
- Supabase Auth
- Supabase Postgres with Row Level Security

## Planned Responsibilities

The backend should handle workflows that should not run directly in the browser or a future mobile app:

- AI/LLM requests.
- Transient audio transcription orchestration.
- Secret API keys.
- Account deletion.
- Privileged Supabase operations.
- Future webhooks or scheduled jobs.

Ordinary user-owned data may still be read or written directly through Supabase from the client when protected by Row Level Security.

## Current Status

Initial scaffold created and verified. See `../BACKEND_BRAINSTORM.md` for planning notes.

The Supabase project structure has been initialized at `../supabase/`, including the first schema migration and seed data.

Current routes:

- `GET /`
- `GET /health`
- `GET /health/supabase`
- `GET /me`
- `PATCH /me/profile`

## Setup

Use Node.js 24 or newer.

Install dependencies from the repo root:

```powershell
npm install
npm install --prefix backend
```

Create a local `.env` file from `../.env.example` or `backend/.env.example`.

For local Supabase values, run:

```powershell
npm run supabase:status
```

Use the local Project URL as `SUPABASE_URL` and the local Secret key as `SUPABASE_SECRET_KEY`.

Example local values should come from your own `npm run supabase:status` output, not from committed files or chat history.

## Commands

From the repo root:

```powershell
npm run backend:dev
npm run backend:typecheck
npm run backend:build
npm run backend:start
```

From this directory:

```powershell
npm run dev
npm run typecheck
npm run build
npm run start
```

## Routes

- `GET /` - basic API metadata.
- `GET /health` - backend health check.
- `GET /health/supabase` - verifies the backend can query Supabase.
- `GET /me` - verifies a Supabase access token and returns the current user plus profile.
- `PATCH /me/profile` - updates editable fields on the current user's profile.

Expected local response from `GET /health/supabase`:

```json
{
  "status": "ok",
  "service": "supabase",
  "pluginCount": 6
}
```

`GET /me` requires a Supabase access token:

```http
Authorization: Bearer <supabase-access-token>
```

Expected response shape:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2026-06-10T00:00:00.000Z"
  },
  "profile": {
    "id": "user-id",
    "display_name": null,
    "email": "user@example.com",
    "avatar_url": null,
    "timezone": "America/Toronto",
    "created_at": "2026-06-10T00:00:00.000Z",
    "updated_at": "2026-06-10T00:00:00.000Z"
  }
}
```

`PATCH /me/profile` requires the same bearer token and accepts one or more editable fields:

```json
{
  "displayName": "Jordan Miller",
  "timezone": "America/Toronto",
  "avatarUrl": null
}
```

The API uses camelCase request fields. The database keeps snake_case column names.

## Early Implementation Notes

- Do not expose Supabase secret/service keys to frontend or mobile code.
- Prefer request validation for all public routes.
- Keep raw audio transient for the initial LLM flow.
- Keep API contracts frontend-agnostic so the app can later support web, mobile, or both.
