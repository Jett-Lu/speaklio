# Speaklio

Speaklio is a voice-first personal care dashboard for turning natural language into structured updates across modular tracking areas.

This repository is organized as a small capstone monorepo. The current frontend is a static prototype, the backend is an Express + TypeScript scaffold, and Supabase provides auth/database infrastructure.

Use Node.js 24 or newer for local development.

## Requirements

- Node.js 24 or newer.
- Docker Desktop for local Supabase.
- Supabase CLI, installed through the root `package.json`.

## Repository Structure

- `frontend/` - current static dashboard prototype.
- `backend/` - Express + TypeScript API service.
- `supabase/` - local Supabase config, migrations, and seed data.
- `docs/` - architecture notes, testing guides, and temporary planning docs.

## First-Time Setup

Install root and backend dependencies:

```powershell
npm install
npm install --prefix backend
```

Start local Supabase:

```powershell
npm run supabase:start
npm run supabase:db:reset
```

Create a local `.env` from `.env.example`, then fill in Supabase values from:

```powershell
npm run supabase:status
```

## Project Areas

### Frontend

The current frontend is a mobile-first static prototype using plain HTML, CSS, and JavaScript.

See `frontend/README.md` for preview instructions and feature notes.

Useful command:

```powershell
npm run frontend:dev
```

### Backend

The backend is an Express + TypeScript service for privileged workflows such as AI/LLM requests, account deletion, and operations that require secret keys.

Current backend routes include health checks, `GET /me`, and `PATCH /me/profile`.

Useful commands:

```powershell
npm run backend:dev
npm run backend:typecheck
npm run backend:build
```

See `backend/README.md` for details.

Auth docs:

- `docs/auth-architecture.md`
- `docs/auth-testing.md`

## Current Planning Assumptions

- Start with personal tracking.
- Use Supabase for auth and database.
- Use a small Express + TypeScript backend for secrets, AI/LLM workflows, account deletion, and other privileged operations.
- Keep raw audio transient for the initial LLM query flow.
- Keep the frontend/mobile choice flexible.

See `docs/BACKEND_BRAINSTORM.md` for the working backend planning notes.

## Local Supabase

Useful commands:

```powershell
npm run supabase:start
npm run supabase:status
npm run supabase:psql
npm run supabase:db:reset
npm run supabase:stop
```

The first schema migration lives in `supabase/migrations/`, and default plugin data lives in `supabase/seed.sql`.

The `supabase:psql` script opens `psql` inside the local Supabase Postgres container, so a separate local PostgreSQL client install is not required.

## Cloud Supabase

This repo has been linked to the shared Supabase cloud project. If a teammate needs to link their local checkout:

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
```

After linking, push migrations and seed default data:

```powershell
npm run supabase:db:push
npm run supabase:seed:remote
```

## Verification

```powershell
npm run backend:typecheck
npm run backend:build
```
