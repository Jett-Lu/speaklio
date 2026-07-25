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

Initial scaffold created and verified. See `../docs/backend-technical-decisions.md` for current backend planning notes.

The Supabase project structure has been initialized at `../supabase/`, including database migrations and seed data.

Auth design and manual testing notes:

- `../docs/auth-architecture.md`
- `../docs/auth-testing.md`

Current routes:

- `GET /`
- `GET /health`
- `GET /health/supabase`
- `POST /ai/parse-command`
- `POST /ai/preview-entry`
- `POST /ai/confirm-actions`
- `GET /me`
- `PATCH /me/profile`
- `DELETE /me`
- `GET /plugins`
- `PUT /plugins/:pluginId/enable`
- `DELETE /plugins/:pluginId/enable`
- `GET /entries`
- `GET /entries/summary`
- `POST /entries`
- `GET /entries/:id`
- `PATCH /entries/:id`
- `DELETE /entries/:id`
- `GET /activities`
- `GET /integrations`
- `GET /dashboard/summary`

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
- `POST /ai/parse-command` - parses user text with local Ollama and returns structured actions without writing to the database.
- `POST /ai/preview-entry` - converts text or parsed actions into proposed metric entry payloads without writing to the database.
- `POST /ai/confirm-actions` - saves reviewed metric entry payloads and creates matching activity rows.
- `GET /me` - verifies a Supabase access token and returns the current user plus profile.
- `PATCH /me/profile` - updates editable fields on the current user's profile.
- `DELETE /me` - deletes the authenticated Supabase account.
- `GET /plugins` - lists active plugins with the current user's enabled state.
- `PUT /plugins/:pluginId/enable` - enables a plugin for the current user.
- `DELETE /plugins/:pluginId/enable` - disables a plugin for the current user.
- `GET /entries` - lists the current user's metric entries.
- `GET /entries/summary` - aggregates entries across a caller-supplied date window.
- `POST /entries` - creates a metric entry and related activity row for the current user.
- `GET /entries/:id` - reads one metric entry owned by the current user.
- `PATCH /entries/:id` - updates one metric entry owned by the current user.
- `DELETE /entries/:id` - deletes one metric entry owned by the current user.
- `GET /activities` - lists backend-generated timeline rows for the current user.
- `GET /integrations` - returns current connected-app availability/status metadata.
- `GET /dashboard/summary` - returns backend-computed dashboard totals and insight copy.

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
  "displayName": "Sam Reader",
  "timezone": "America/Toronto",
  "avatarUrl": null,
  "personal": {
    "age": 29,
    "heightCm": 178,
    "weightKg": 78,
    "activityLevel": "moderate"
  },
  "goals": {
    "primaryGoal": "maintain",
    "targetWeightKg": 78,
    "calorieGoal": 2100,
    "proteinGoal": 120,
    "hydrationGoal": 2700,
    "weeklyWorkouts": 4
  },
  "preferences": {
    "units": "Metric",
    "notifications": true,
    "weeklySummary": true,
    "assistantInsights": true,
    "compactCards": false,
    "monthlyBudget": 2000
  }
}
```

The API uses camelCase request fields. The database keeps snake_case column names.

`DELETE /me` permanently deletes the authenticated Supabase user. Related profile, plugin settings, entries, and activities are removed by database cascades.

## Plugin Settings

All `/plugins` routes require a Supabase access token.

List plugins:

```http
GET /plugins
```

Enable or disable one plugin:

```http
PUT /plugins/workout/enable
DELETE /plugins/workout/enable
```

Response plugins include the user's enabled state:

```json
{
  "plugin": {
    "id": "workout",
    "name": "Workout Tracker",
    "description": "Track exercise sessions, sets, reps, and progress.",
    "icon": "dumbbell",
    "isActive": true,
    "enabled": true
  }
}
```

## Local AI Parsing

`POST /ai/parse-command` requires a Supabase access token:

```http
Authorization: Bearer <supabase-access-token>
```

Request body:

```json
{
  "text": "log leg curls 20 kg 3 sets"
}
```

Expected response shape:

```json
{
  "actions": [
    {
      "type": "log_workout",
      "exercise": "leg curls",
      "sets": 3,
      "load": 20,
      "load_unit": "kg",
      "confidence": 0.9
    }
  ],
  "needsConfirmation": false,
  "message": null
}
```

The endpoint calls local Ollama at `LOCAL_AI_URL` with `LOCAL_AI_MODEL`. It validates the model response and returns parsed actions only. It does not create entries.

`POST /ai/preview-entry` accepts either raw text or parsed actions and returns proposed entry payloads:

```json
{
  "actions": [
    {
      "type": "log_workout",
      "exercise": "leg curls",
      "sets": 3,
      "load": 20,
      "load_unit": "kg"
    }
  ]
}
```

`POST /ai/confirm-actions` saves reviewed entry payloads:

```json
{
  "entries": [
    {
      "pluginId": "workout",
      "entryType": "log_workout",
      "metadata": {
        "exercise": "leg curls",
        "sets": 3,
        "load": 20,
        "loadUnit": "kg"
      }
    }
  ]
}
```

Confirmed entries create matching activity rows. The intended flow is parse, preview, let the user confirm, then save.

Default local AI environment values:

```env
LOCAL_AI_URL=http://localhost:11434
LOCAL_AI_MODEL=speaklio-parser
```

## Metric Entry CRUD

All `/entries` routes require a Supabase access token:

```http
Authorization: Bearer <supabase-access-token>
```

Create request:

```json
{
  "pluginId": "workout",
  "entryType": "log_workout",
  "value": null,
  "unit": null,
  "metadata": {
    "exercise": "leg curls",
    "sets": 3,
    "load": 20,
    "loadUnit": "kg"
  },
  "occurredAt": "2026-06-23T23:00:00.000Z"
}
```

List filters:

```http
GET /entries?pluginId=workout&entryType=log_workout&from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.000Z&limit=20&offset=0
```

Supported filters are `pluginId`, `entryType`, `from`, `to`, `limit`, and `offset`.

Supported entry contracts:

| Entry type | Value/unit | Required metadata | Notes |
| --- | --- | --- | --- |
| `log_food` | optional calories with `cal` | `food` | Optional `calories`, `protein`, `carbs`, and `fats` metadata are used by dashboard summaries. |
| `log_calories` | numeric calories with optional `cal` | none | Adds to nutrition calories. |
| `log_weight` | numeric weight with `kg` or `lb` | none | Used for body-weight tracking. |
| `log_expense` | positive amount with `usd` or `cad` | `category` | Optional `note` is used in activity summaries. |
| `log_sleep` | positive minutes with `min` | none | Optional `quality` is shown in summaries. |
| `log_hydration` | positive amount with `ml`, `l`, or `oz` | none | Summary totals normalize to milliliters. |
| `log_mindfulness` | positive minutes with `min` | none | Optional `title` names the session. |
| `log_workout` | optional | `exercise` | Optional boolean `completed` distinguishes planned and completed workouts. |

Response entries use camelCase fields:

```json
{
  "entries": [
    {
      "id": "entry-id",
      "userId": "user-id",
      "pluginId": "workout",
      "entryType": "log_workout",
      "value": null,
      "unit": null,
      "metadata": {
        "exercise": "leg curls"
      },
      "occurredAt": "2026-06-23T23:00:00+00:00",
      "createdAt": "2026-06-23T23:00:00+00:00"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

`POST /entries` also returns an `activity` object when timeline activity creation succeeds.

Summary query:

```http
GET /entries/summary?from=2026-07-01T00:00:00.000Z&to=2026-07-31T23:59:59.999Z
```

The summary response includes the requested `window`, domain totals, `byPlugin`, and `byEntryType` rollups.

## Read Models

All read-model routes require a Supabase access token.

```http
GET /activities?pluginId=hydration&from=2026-07-01T00:00:00.000Z&to=2026-07-31T23:59:59.999Z&limit=20&offset=0
GET /dashboard/summary?date=2026-07-18
GET /integrations
```

- `GET /activities` returns backend-generated timeline rows scoped to the current user.
- `GET /dashboard/summary` returns dashboard card totals, date windows, balance, readiness, next action, attention items, and agenda copy.
- `GET /integrations` returns connected-app status metadata. Unavailable integrations return `available: false` and a non-connected status instead of presenting a fake connection flow.

## Early Implementation Notes

- Do not expose Supabase secret/service keys to frontend or mobile code.
- Prefer request validation for all public routes.
- Keep raw audio transient for the initial LLM flow.
- Keep API contracts frontend-agnostic so the app can later support web, mobile, or both.
