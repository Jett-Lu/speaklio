# Remaining Work

Scope: local full-product readiness, excluding hosted deployment/infrastructure and excluding the frontend rewrite.

Last updated: 2026-06-23

## Goal

Define what is still needed for Speaklio to feel like a complete local app with a working backend, Supabase data persistence, auth, manual CRUD, and local AI-assisted logging.

## Core Backend

- Done: add account deletion route: `DELETE /me`.
- Done: add plugin settings routes:
  - Enable a plugin for the authenticated user.
  - Disable a plugin for the authenticated user.
  - List active plugins plus the user's enabled state.
- Partly done: add activity timeline behavior:
  - Create activity rows when entries are created.
  - Deleting an entry deletes related activity through `metric_entry_id` cascade.
  - Still decide whether activities are editable/deletable directly.
- Partly done: improve `/entries`:
  - Add pagination beyond simple `limit`.
  - Add date range filters.
  - Add stronger domain-specific validation for common entry types.
  - Still standardize error response shapes across all backend routes.

## Local AI Flow

- Done: add an action-to-entry preview mapper.
  - Convert parsed AI actions into proposed `metric_entries` payloads.
  - Do not write to Supabase during preview.
- Done: add preview endpoint:
  - `POST /ai/preview-entry`
- Done: add confirm/save flow:
  - `POST /ai/confirm-actions`
  - Confirmed entries create matching activity rows.
- Partly done: handle low-confidence or unsupported AI actions clearly.
  - Unsupported actions return preview items with `entry: null` and a reason.
  - Still decide how the UI should handle low-confidence actions.
- Add simple behavior for:
  - `request_tip`
  - `ask_dashboard_question`
  - `unknown`
- Add tests for parser mapping without requiring Ollama.

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

- Add backend unit tests for:
  - Zod validation.
  - AI action mapping.
  - Entry payload mapping.
- Add integration tests for:
  - `GET /me`
  - `PATCH /me/profile`
  - `/entries` CRUD
  - AI unavailable behavior
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

1. Add backend tests for entry validation and AI action mapping.
2. Add a backend smoke test script so manual verification is repeatable.
3. Standardize error response shapes.
4. Decide frontend behavior for low-confidence AI actions.
5. Add simple `request_tip`, `ask_dashboard_question`, and `unknown` handling.
