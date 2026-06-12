# Auth Architecture

Status: accepted for current backend phase

Last updated: 2026-06-10

## Context

Speaklio uses Supabase for authentication and Postgres. The app may later have web and mobile clients, so auth should not depend on one frontend framework.

The backend is an Express + TypeScript API for privileged workflows. It should not own user passwords or reimplement Supabase Auth.

## Decision

Signup, signin, signout, token refresh, and password reset should use Supabase Auth directly from the client.

Protected Express routes should require a Supabase access token:

```http
Authorization: Bearer <supabase-access-token>
```

The Express backend verifies that token with Supabase before running protected route logic.

## Responsibilities

### Client

- Calls Supabase Auth for signup/signin/signout.
- Stores the Supabase session using the client framework's recommended storage.
- Sends the access token to protected Express routes.
- Never stores or uses the Supabase secret/service key.

### Express Backend

- Verifies Supabase bearer tokens for protected routes.
- Uses the Supabase secret key only on the server.
- Handles privileged workflows such as AI calls, account deletion, and secret third-party integrations.
- May update user-owned data when the workflow belongs behind backend validation.

### Supabase

- Owns user identity.
- Stores auth users.
- Stores profile and app data in Postgres.
- Enforces Row Level Security for direct client access.
- Creates a profile row after signup through the database trigger in the initial migration.

## Current Backend Auth Surface

- `GET /me`
  - Requires a Supabase access token.
  - Returns the authenticated auth user and matching profile row.
- `PATCH /me/profile`
  - Requires a Supabase access token.
  - Updates editable profile fields.

## Security Rules

- Do not put `SUPABASE_SECRET_KEY` or service role keys in browser or mobile code.
- Do not commit `.env` files.
- Keep Row Level Security enabled on user-owned tables.
- Treat bearer tokens as secrets.
- Prefer short, explicit protected routes over broad backend access.

## Not In Scope Yet

- Custom password handling.
- OAuth provider setup.
- Magic link design.
- Password reset UI.
- User-to-user sharing.
- Role-based admin permissions.
- Account deletion policy.

## Open Decisions

- Whether account deletion should be immediate hard delete, delayed deletion, or anonymization plus deletion.
- Whether assistant transcripts should be stored or treated as transient unless converted into structured log entries.
- Whether clients should read some user-owned data directly from Supabase or route more reads through Express.
