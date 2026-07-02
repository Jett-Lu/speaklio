# Manual Auth Testing

These notes cover local manual testing for the current Supabase + Express auth flow.

## Prerequisites

- Docker Desktop is running.
- Node.js 24 or newer is active.
- Local Supabase is running.
- Backend dependencies are installed.

From the repo root:

```powershell
npm install
npm install --prefix backend
npm run supabase:start
npm run supabase:db:reset
npm run backend:build
```

## Local Environment

Create `.env` from `.env.example`.

Get local Supabase values:

```powershell
npm run supabase:status
```

Use:

- Project URL as `SUPABASE_URL`
- Secret key as `SUPABASE_SECRET_KEY`

Do not commit `.env`.

## Start The Backend

```powershell
npm run backend:dev
```

The API should run at:

```text
http://localhost:3000
```

## Health Checks

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/health/supabase
```

Expected Supabase health response:

```json
{
  "status": "ok",
  "service": "supabase",
  "pluginCount": 6
}
```

## Create A Local User

For manual testing before frontend auth exists, use Supabase's local Auth REST endpoint.

In PowerShell, fill these values from `npm run supabase:status`:

```powershell
$apiUrl = "http://127.0.0.1:54321"
$anonKey = "<local-anon-key>"
$email = "manual-test@example.com"
$password = "TestPassword123!"

$headers = @{
  apikey = $anonKey
  Authorization = "Bearer $anonKey"
  "Content-Type" = "application/json"
}

$body = @{
  email = $email
  password = $password
  data = @{
    display_name = "Manual Test"
  }
} | ConvertTo-Json -Depth 5

$signup = Invoke-RestMethod -Method Post -Uri "$apiUrl/auth/v1/signup" -Headers $headers -Body $body
$accessToken = $signup.access_token
```

If `$accessToken` is empty, sign in:

```powershell
$signinBody = @{
  email = $email
  password = $password
} | ConvertTo-Json

$signin = Invoke-RestMethod -Method Post -Uri "$apiUrl/auth/v1/token?grant_type=password" -Headers $headers -Body $signinBody
$accessToken = $signin.access_token
```

Treat `$accessToken` as a secret.

## Test `GET /me`

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/me" -Headers @{
  Authorization = "Bearer $accessToken"
}
```

Expected result:

- `user.id` is present.
- `user.email` matches the test email.
- `profile.id` matches `user.id`.
- `profile.email` matches the test email.

## Test `PATCH /me/profile`

```powershell
$updateBody = @{
  displayName = "Updated Manual Test"
  timezone = "America/Toronto"
  avatarUrl = $null
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/me/profile" -Headers @{
  Authorization = "Bearer $accessToken"
  "Content-Type" = "application/json"
} -Body $updateBody
```

Then read the user again:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/me" -Headers @{
  Authorization = "Bearer $accessToken"
}
```

Expected result:

- `profile.display_name` is updated.
- `profile.timezone` is updated.
- `profile.updated_at` changed.

## Optional: Test Plugin Settings

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/plugins" -Headers @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Method Put -Uri "http://localhost:3000/plugins/workout/enable" -Headers @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/plugins/workout/enable" -Headers @{
  Authorization = "Bearer $accessToken"
}
```

Expected result:

- The plugin list returns active plugins.
- The enable route returns the selected plugin with `enabled = true`.
- The disable route returns the selected plugin with `enabled = false`.

## Optional: Test Account Deletion

Only run this with a throwaway local test user.

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/me" -Headers @{
  Authorization = "Bearer $accessToken"
}
```

Expected result:

- HTTP `204`
- The same token should no longer work for protected routes.

## Test Missing Auth

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/me"
```

Expected result:

- HTTP `401`
- Error message: `Missing bearer token`

## Current Auth Boundary

- Clients use Supabase Auth directly for signup/signin.
- Express verifies Supabase access tokens on protected routes.
- Express keeps server-only keys out of frontend/mobile code.
