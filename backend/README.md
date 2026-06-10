# Speaklio Backend

This is the planned Speaklio backend service. It is an Express + TypeScript API for workflows that should not run directly in the browser or a future mobile app.

## Planned Stack

- Node.js
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

Initial scaffold created. See `../BACKEND_BRAINSTORM.md` for planning notes.

The Supabase project structure has been initialized at `../supabase/`, including the first schema migration and seed data.

## Setup

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

## Early Implementation Notes

- Do not expose Supabase secret/service keys to frontend or mobile code.
- Prefer request validation for all public routes.
- Keep raw audio transient for the initial LLM flow.
- Keep API contracts frontend-agnostic so the app can later support web, mobile, or both.
