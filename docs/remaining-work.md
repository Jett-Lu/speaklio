# Remaining Work

Scope: local full-product readiness, excluding hosted deployment/infrastructure and excluding the frontend rewrite.

Last updated: 2026-07-18

## Goal

Define what is still needed for Speaklio to feel like a complete local app with a working backend, Supabase data persistence, auth, manual CRUD, and local AI-assisted logging.

## Core Backend

- Done: add account deletion route: `DELETE /me`.
- Done: add plugin settings routes:
  - Enable a plugin for the authenticated user.
  - Disable a plugin for the authenticated user.
  - List active plugins plus the user's enabled state.
- Done: add activity timeline behavior:
  - Create activity rows when entries are created.
  - Deleting an entry deletes related activity through `metric_entry_id` cascade.
  - Expose authenticated activity listing through `GET /activities`.
  - Current decision: signed-in activities stay derived from entries; direct activity deletion/archive is future product work.
- Done: improve `/entries`:
  - Add pagination beyond simple `limit`.
  - Add date range filters.
  - Add stronger domain-specific validation for common entry types.
  - Add `GET /entries/summary` for windowed rollups.
- Remaining: standardize error response shapes across all backend routes.

## Local AI Flow

- Done: add an action-to-entry preview mapper.
  - Convert parsed AI actions into proposed `metric_entries` payloads.
  - Do not write to Supabase during preview.
- Done: add preview endpoint:
  - `POST /ai/preview-entry`
- Done: add confirm/save flow:
  - `POST /ai/confirm-actions`
  - Confirmed entries create matching activity rows.
- Done: handle low-confidence or unsupported AI actions clearly.
  - Unsupported actions return preview items with `entry: null` and a reason.
  - Signed-in frontend uses backend previews by default and requires confirmation before writes.
- Future: add richer conversational behavior for:
  - `request_tip`
  - `ask_dashboard_question`
  - `unknown`
- Done: add tests for parser mapping without requiring Ollama.

## Data Model

- Current decision: keep the generic `metric_entries` table for the capstone demo unless a feature clearly needs a first-class table.
- Consider first-class tables later for:
  - Workouts
  - Food logs
  - Weight logs
  - Weight goals
  - Sleep sessions
- Done: add indexes for common local query patterns:
  - `user_id`
  - `plugin_id`
  - `entry_type`
  - `occurred_at`
- Done: activities reference source entries with nullable `metric_entry_id`.

## Local Developer Experience

- Create a clear local startup flow for:
  - Supabase
  - Backend
  - Frontend
  - Ollama/local AI
- Add a local test user helper or script.
- Add a backend smoke test script.
- Consider adding an HTTP request collection for manual route testing.
- Document common troubleshooting:
  - Docker Desktop not running.
  - Supabase ports already in use.
  - Ollama not installed/running.
  - Missing `.env` values.

## Testing

- Done: add backend unit tests for:
  - Zod validation.
  - AI action mapping.
  - Entry payload mapping.
- Done: add route tests for:
  - `GET /me`
  - `PATCH /me/profile`
  - `/entries` CRUD
  - activity listing
  - dashboard summary
  - plugin enablement
  - AI preview/confirm
- Add RLS sanity checks.
- Add tests that confirm one user cannot read/update/delete another user's rows.

## Security And Privacy

- Decide account deletion policy:
  - Immediate hard delete.
  - Delayed deletion.
  - Anonymization plus deletion.
- Add basic rate limiting for AI routes.
- Keep input size limits on AI and CRUD routes.
- Keep raw audio transient.
- Decide whether transcripts are stored or transient.
- Continue keeping Supabase secret keys server-only.

## Documentation

- Add API reference for current backend routes.
- Keep `docs/auth-architecture.md` updated as auth behavior changes.
- Keep `docs/backend-technical-decisions.md` updated as CRUD and AI decisions change.
- Add local AI troubleshooting notes once Ollama setup is tested by more than one teammate.

## Suggested Next Sequence

1. Add a backend smoke test script so manual verification is repeatable.
2. Standardize error response shapes.
3. Add RLS sanity checks.
4. Add simple `request_tip`, `ask_dashboard_question`, and `unknown` handling.
5. Decide production activity archive/delete semantics.
