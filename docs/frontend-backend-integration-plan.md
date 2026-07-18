# Frontend Backend Integration Plan

This plan audits the current static frontend and records the path to remove hardcoded prototype values so Speaklio works from persisted backend data.

Current branch context: `frontEndIntegration`.

## Implementation Progress

Started on July 18, 2026:

- Removed the most visible authenticated demo fallback values from frontend state and static HTML.
- Changed signed-in state loading so dashboard metrics/profile/activity are not hydrated from stale local demo cache.
- Added empty-state dashboard copy for accounts with no logged entries.
- Prevented account setup from creating a fake local sign-in without Supabase OTP verification.
- Added backend validation for the frontend-written entry types `log_expense`, `log_sleep`, `log_hydration`, and `log_mindfulness`.
- Expanded backend activity summaries for frontend-written entry types.
- Added authenticated `GET /activities` and switched the signed-in frontend timeline to backend activity rows.
- Changed signed-in clear-activity behavior to explain that activity is derived from entries until backend deletion/archive support exists.
- Added authenticated `GET /dashboard/summary` and switched signed-in dashboard metric refreshes to backend-computed summary data.
- Wired signed-in assistant previews to `POST /ai/preview-entry` and Confirm actions to `POST /ai/confirm-actions` for backend-supported proposed entries.
- Removed the fake microphone fallback that logged a hardcoded meal when browser voice input was unavailable.
- Expanded local AI action contracts and backend preview mapping for expenses, sleep, hydration, and mindfulness.
- Shared entry validation between normal entry creation and AI confirmation so assistant-created entries follow the same contracts.
- Moved plugin modal categories, quality options, and quick presets into a frontend plugin UI registry.
- Marked Apple Health, Apple Watch, and meal scanning as coming soon instead of presenting fake connection or scan-save flows.
- Removed hardcoded submitted meal macro defaults from the nutrition form; remaining values are placeholders only.
- Changed signed-in `speaklio-state-v3` persistence to store only local UI state instead of backend-owned profile, plugin, metric, and activity data.
- Added a visible backend refresh failure banner with retry, and stopped clearing the saved session on startup API failures.
- Reset local state on sign-out so signed-in dashboard data is not written back into signed-out local storage.

## Goal

Make the frontend a real authenticated app backed by Supabase and the Express API, while preserving enough starter UI behavior that empty accounts still feel usable.

The desired end state:

- Signed-in users see profile, goals, plugin settings, entries, activity, and summaries loaded from the backend.
- User actions write to backend APIs first, then refresh client state from backend responses.
- Demo defaults become explicit empty-state/starter-state behavior, not hidden source-of-truth data.
- Client-side calculations that need shared product meaning move into reusable backend/read-model endpoints.

## Current Backend Surface

Already available:

- `GET /health`
- `GET /health/supabase`
- `GET /me`
- `PATCH /me/profile`
- `DELETE /me`
- `GET /plugins`
- `PUT /plugins/:pluginId/enable`
- `DELETE /plugins/:pluginId/enable`
- `GET /entries`
- `POST /entries`
- `GET /entries/:id`
- `PATCH /entries/:id`
- `DELETE /entries/:id`
- `GET /dashboard/summary`
- `POST /ai/parse-command`
- `POST /ai/preview-entry`
- `POST /ai/confirm-actions`

Current database areas:

- `profiles`
- `plugins`
- `user_plugins`
- `metric_entries`
- `activities`

Recently added profile fields:

- `profiles.personal_data`
- `profiles.goals`
- `profiles.preferences`

## Frontend Architecture Today

The frontend is a static app in:

- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`
- `frontend/server.js`

The app still keeps most derived UI state in a large client-side `state` object from `makeDefaultState()` in `frontend/app.js`.

Current persistence is mixed:

- Real auth session is stored in `localStorage` under `speaklio-auth-session-v1`.
- Full dashboard state is still cached in `localStorage` under `speaklio-state-v3`.
- Profile, plugins, and entries now partly round-trip through the backend.
- Several UI values still come from hardcoded defaults or client-only heuristics.

## Hardcoded Values Audit

### 1. Hardcoded Signed-Out/Auth Placeholders

Location: `frontend/index.html`

- Login email input defaults to `jordan@example.com`.
- Account setup defaults to:
  - `Jordan Miller`
  - `jordan@example.com`
  - age `29`
  - activity level `moderate`
  - height `178`
  - weight `78`
- Static sidebar/profile markup still contains:
  - `Jordan Miller`
  - `Free plan`
  - `Good evening, Jordan.`
- Static assistant HTML contains a fallback `Hi Jordan...` bubble.

Plan:

- Keep HTML defaults minimal and generic.
- Let `renderAll()` populate all user-facing identity values after state load.
- Use empty inputs or configurable seed values for account setup.
- Replace plan text like `Free plan` with real account/subscription data later, or hide it until the backend supports plan state.

Priority: high for polish, medium for functionality.

### 2. Default Dashboard State

Location: `frontend/app.js`, `makeDefaultState()`

Hardcoded prototype values:

- Profile:
  - name `Jordan Miller`
  - email `jordan@example.com`
  - timezone `Toronto`
  - units `Metric`
  - notifications enabled
  - weekly summary enabled
  - assistant insights enabled
  - compact cards disabled
- Personal data:
  - age `29`
  - height `178`
  - weight `78`
  - activity level `moderate`
- Goals:
  - primary goal `maintain`
  - target weight `78`
  - calorie goal `2100`
  - protein goal `120`
  - hydration goal `2700`
  - weekly workouts `4`
- Metrics:
  - calories `1420`
  - protein `72`
  - carbs `164`
  - fats `54`
  - spending `1264`
  - budget `2000`
  - sleep `462` minutes
  - sleep week `[390, 430, 485, 415, 450, 510, 462]`
  - workout `Upper body strength`
  - workout time `Tomorrow, 7:30 AM`
  - workout duration `45`
  - workout completed `3`
  - hydration `1400`
  - mindfulness count `3`
  - mindfulness title `Evening reset`
  - mindfulness duration `10`
- Installed plugins:
  - nutrition
  - finance
  - sleep
  - workout
- Activity items:
  - avocado toast
  - sleep summary
  - grocery expense
  - evening walk
  - chicken rice bowl

Plan:

- Split state into:
  - `defaultProfileSettings`: neutral values used only for new profile initialization.
  - `emptyDashboardState`: zeros/nulls for no-entry accounts.
  - `demoSeedState`: optional development-only seed fixture.
- Stop loading metric totals from localStorage once authenticated.
- Add explicit empty states for dashboard cards when no entries exist.
- Use backend-loaded profile/goals/preferences whenever signed in.

Priority: high.

### 3. Hardcoded Plugin Catalog Fallback

Location: `frontend/app.js`, top-level `plugins` array

Hardcoded plugins:

- nutrition
- finance
- sleep
- workout
- hydration
- mindfulness

Current reality:

- Backend `GET /plugins` can return active plugins and user enablement.
- Frontend still needs the local array as an unauthenticated fallback and as a render guard before API data arrives.

Plan:

- Keep a small fallback catalog for signed-out mode only.
- After sign-in, treat `GET /plugins` as source of truth.
- Add loading and error states around plugin fetch.
- Consider moving per-plugin UI metadata to backend or a shared frontend registry:
  - color class
  - card component key
  - supported entry forms
  - display order

Priority: medium.

### 4. Client-Derived Summary Calculations

Location: `frontend/app.js`

Current hardcoded/heuristic calculations:

- Daily balance score averages calories, finance, sleep, workout, and hydration percentages.
- Sleep benchmark is hardcoded at `480` minutes.
- Sleep bars use hardcoded max `540` minutes and min visual height `20`.
- “On track” threshold is hardcoded at `70`.
- Balance title threshold is hardcoded at `75`.
- Protein insight uses hardcoded `120` instead of `state.profile.goals.proteinGoal`.
- Readiness uses hardcoded `420` minute sleep threshold.
- Streak count is `Math.min(7, state.activities.length)`.
- Finance monthly budget is still local `state.finance.budget`, not persisted as a goal/preference.
- Week/month date ranges are computed in the browser.

Plan:

- Short term:
  - Replace hardcoded `120` with `state.profile.goals.proteinGoal`.
  - Persist finance monthly budget in profile goals or preferences.
  - Centralize thresholds in one frontend config object.
- Medium term:
  - Add backend summary endpoint:
    - `GET /dashboard/summary?date=YYYY-MM-DD`
    - returns cards, balance score, readiness, next action, agenda, and date windows.
  - Add backend aggregation endpoint:
    - `GET /entries/summary?from=&to=`
    - returns totals by plugin and entry type.
- Long term:
  - Make product rules testable backend services rather than browser-only calculations.

Priority: high for correctness.

### 5. Entry Type Mismatch And Loose Metadata

Frontend currently writes entry types:

- `log_food`
- `log_expense`
- `log_sleep`
- `log_workout`
- `log_hydration`
- `log_mindfulness`

Backend currently validates only these special cases:

- `log_weight`
- `log_calories`
- `log_workout`
- `log_food`

Backend accepts other entry types but does not deeply validate them.

Current mismatch examples:

- `entryActivity.ts` summarizes `log_workout`, `log_food`, `log_calories`, and `log_weight`, but not `log_expense`, `log_sleep`, `log_hydration`, or `log_mindfulness`.
- Frontend uses metadata keys like `duration`, while AI mapper uses `durationMinutes`.
- Frontend planned workouts and completed workouts both use `log_workout`, with `metadata.completed` as the distinction.

Plan:

- Define shared entry contracts for each plugin:
  - plugin id
  - entry type
  - value/unit expectations
  - required metadata
  - optional metadata
  - display summary rules
- Add backend validation for:
  - `log_expense`
  - `log_sleep`
  - `log_hydration`
  - `log_mindfulness`
  - planned workout versus completed workout
- Align AI mapper output with frontend/backend metadata naming.
- Update `entryActivity.ts` summaries for all frontend-written entry types.

Priority: high.

### 6. Activities And Timeline

Location: `frontend/app.js`

Current hardcoded/fake pieces:

- `state.activities` starts with fake activity.
- `addActivity()` creates local-only activity objects.
- `renderActivity()` groups by browser-generated `day` strings.
- `clear-activity-button` clears only local state, not backend data.
- There is no frontend call to a backend `GET /activities` endpoint.

Backend reality:

- Activities are generated on `POST /entries`.
- There is no dedicated activity list route yet.
- Frontend currently maps entries into activity-shaped objects itself.

Plan:

- Decide whether timeline source should be:
  - derived from `GET /entries`, or
  - first-class `GET /activities`.
- Recommended:
  - Add `GET /activities?from=&to=&pluginId=&limit=&offset=`.
  - Keep activities derived from entries for creation.
  - Treat clear activity as either unsupported, or as bulk delete/archive with explicit backend support.
- Frontend should stop maintaining local-only activity state for signed-in users.

Priority: medium-high.

### 7. Assistant Flow Is Still Mostly Client-Mocked

Location: `frontend/app.js`, `previewAssistantRequest()` and `processRequest()`

Current hardcoded behavior:

- Regex-based command parsing in browser.
- Client guesses categories, calories, macros, sleep quality, workout plans.
- `setTimeout()` simulates assistant delay.
- Assistant preview confirm/edit buttons only show toast messages.
- Microphone fallback injects `"I had eggs and toast for breakfast"`.

Backend reality:

- `/ai/parse-command` calls local Ollama.
- `/ai/preview-entry` maps parser actions to proposed entries.
- `/ai/confirm-actions` persists reviewed entries.

Plan:

- Replace browser regex parsing with:
  - submit text to `POST /ai/preview-entry`
  - render previews from backend response
  - let user confirm/edit
  - confirm through `POST /ai/confirm-actions`
- Keep regex parser only as offline development fallback if explicitly enabled.
- Make assistant preview buttons real:
  - `Confirm` persists previews.
  - `Edit` opens editable proposed entry form.
- Remove the fake microphone fallback entry.
- Store assistant conversation history in backend only if conversation persistence becomes a product requirement.

Priority: high.

### 8. Plugin Modals Have Hardcoded Form Defaults And Insights

Location: `frontend/app.js`, `openPlugin()`

Hardcoded examples:

- Meal default:
  - calories `320`
  - protein `18`
  - carbs `32`
  - fats `12`
- Finance categories:
  - Dining
  - Groceries
  - Transport
  - Bills
  - Other
- Sleep quality choices:
  - Great
  - Good
  - Fair
  - Poor
- Hydration presets:
  - 250 ml
  - 500 ml
  - 750 ml
- Mindfulness presets:
  - 5 min
  - 10 min
  - 15 min
- Insight copy is static and sometimes not true for current data.
- Apple Health and Apple Watch cards are fake.

Plan:

- Convert form defaults into empty forms or last-used values from backend/profile preferences.
- Move category lists and presets into plugin config:
  - either backend plugin metadata
  - or a frontend plugin registry file
- Only show Apple Health/Watch as “coming soon” until integration exists.
- Drive insight copy from backend summary/insight endpoint or simple verified rules.

Priority: medium.

### 9. Profile And Goal Persistence Is Partially Integrated

Current status:

- Name, personal data, goals, and preferences now save through `/me/profile`.
- Email field in profile modal does not change Supabase Auth email.
- Defaults still appear in HTML before JavaScript renders.

Plan:

- Add user-facing copy or disable email editing until auth email change is implemented.
- Add backend route for auth email change only if needed:
  - likely Supabase Auth email update flow
  - requires confirmation handling
- Add frontend loading state while profile is being loaded.
- Add tests for `PATCH /me/profile` with JSON profile fields.

Priority: medium.

### 10. LocalStorage Is Still Doing Too Much

Current localStorage keys:

- `speaklio-auth-session-v1`
- `speaklio-state-v3`

Risks:

- Signed-in backend data can be masked by stale local state.
- Demo state can reappear after refresh if backend load fails.
- Local-only chats and activities may diverge from persisted entries.

Plan:

- Keep `speaklio-auth-session-v1` until Supabase client library/session handling is introduced.
- For signed-in users, localStorage should store only UI preferences that are intentionally local:
  - current view
  - activity search/filter
  - assistant panel open state if desired
- Move persisted app data to backend:
  - profile
  - goals
  - plugin settings
  - entries
  - activities
  - budgets/presets
- Add a clear separation:
  - `loadLocalUiState()`
  - `loadRemoteAppState()`

Priority: high.

## Backend Gaps To Close

### Dashboard Summary API

Add:

```http
GET /dashboard/summary?date=YYYY-MM-DD
```

Response should include:

- profile basics needed for greeting/avatar
- enabled plugin cards
- today nutrition totals
- current month finance totals and budget
- last sleep summary and weekly sleep series
- weekly workout progress and next planned workout
- hydration total and goal
- mindfulness weekly count and suggested session
- daily balance score
- readiness
- next best action
- attention items

Reason:

- Removes hardcoded browser summary rules.
- Gives backend one place to define date windows and product logic.

### Activities API

Add:

```http
GET /activities?pluginId=&from=&to=&limit=&offset=
```

Optional later:

```http
DELETE /activities/:id
```

Reason:

- Current timeline is entry-derived in the browser.
- Backend already creates activity rows but does not expose them.

### Plugin Metadata API

Extend `GET /plugins` or add plugin metadata columns for:

- display order
- color/class key
- supported entry types
- presets
- category lists
- whether plugin is coming soon

Reason:

- Reduces hardcoded plugin behavior in `openPlugin()`.

### Entry Contracts

Add backend validation and summary support for all frontend entry types:

- `log_expense`
- `log_sleep`
- `log_hydration`
- `log_mindfulness`
- `plan_workout` or explicit planned workout type
- `complete_workout` or explicit completed workout type

Reason:

- Generic `metadata` is flexible, but each supported UI flow needs predictable contracts.

### AI Confirmation Integration

Wire frontend assistant to:

```http
POST /ai/preview-entry
POST /ai/confirm-actions
```

Reason:

- Removes browser regex parsing as primary assistant behavior.
- Uses existing local AI parser and backend persistence path.

## Phased Implementation Plan

### Phase 1: Stabilize Data Boundaries

- Create a frontend `apiClient` module or section with typed request helpers.
- Split `state` into:
  - remote app state
  - local UI state
  - fallback demo fixtures
- Remove authenticated metric loading from `speaklio-state-v3`.
- Replace hardcoded HTML identity values with generic placeholders.
- Disable or clearly mark unsupported actions:
  - email change
  - Apple Health
  - Apple Watch
  - clear activity

Acceptance criteria:

- Refresh after sign-in never shows Jordan/demo values for user identity.
- Empty accounts show empty states, not fake activity.
- Backend outage shows a visible error state rather than silently restoring fake data.

### Phase 2: Complete Entry Contracts

- Define supported entry types in backend docs and code.
- Add backend validation for all frontend-written entry types.
- Update `entryActivity.ts` to summarize every supported entry type.
- Align frontend and AI metadata names.
- Add backend tests for create/list/update/delete entries by type.

Acceptance criteria:

- Every frontend logging form writes an entry type that backend validates intentionally.
- Activity summaries match what the frontend displays.
- Invalid metadata returns useful `400` errors.

### Phase 3: Add Real Summary Endpoints

- Add `GET /dashboard/summary`.
- Add `GET /activities`.
- Move date window logic and summary totals to backend services.
- Frontend dashboard renders from summary response.
- Frontend activity page renders from activity response.

Acceptance criteria:

- Dashboard cards no longer calculate business-critical totals from raw entries in the browser.
- Activity timeline no longer depends on local `state.activities`.
- Date ranges are consistent across frontend and backend.

### Phase 4: Replace Mock Assistant Flow

- Replace `processRequest()` regex logic with backend AI preview.
- Render proposed entries from `/ai/preview-entry`.
- Confirm through `/ai/confirm-actions`.
- Support edit-before-confirm.
- Add graceful fallback when local AI is unavailable.

Acceptance criteria:

- Assistant-created entries use the same backend flow as form-created entries.
- Confirm button persists real entries.
- Edit button changes the proposed backend payload before saving.

### Phase 5: Plugin Configuration And Integrations

- Decide which plugin metadata lives in database versus frontend registry.
- Move categories, presets, and plugin capabilities out of inline modal strings.
- Add real integration status model for connected apps.
- Hide or mark unavailable integration actions until implemented.

Acceptance criteria:

- Adding a plugin no longer requires editing one large `openPlugin()` switch for every display detail.
- Fake Apple Health/Watch flows are not presented as working connections.

## Testing Plan

Backend:

- `npm run backend:typecheck`
- Add route tests for:
  - profile preferences
  - entry validation per type
  - dashboard summary
  - activity listing
  - AI preview/confirm

Frontend:

- `node --check frontend/app.js`
- Manual browser flows:
  - sign in with local Supabase OTP
  - edit profile name and refresh
  - edit goals and refresh
  - enable/disable plugins and refresh
  - log each plugin entry and refresh
  - verify empty account has no fake activity
  - test backend-down behavior

Database:

- Verify migrations from a clean reset:
  - `npm run supabase:db:reset`
- Verify linked remote migration behavior separately before production push.

## Open Questions

- Should finance budget be a profile goal, plugin setting, or dedicated finance settings row?
- Should workout planning and workout completion be separate entry types?
- Should activity be editable/deletable, or always derived from entries?
- Should assistant chats persist, or should only confirmed entries persist?
- Which plugin metadata belongs in Supabase versus frontend code?
- Do we want Supabase JS client in the frontend, or keep direct REST calls for this static prototype?

## Recommended Next Step

Start with Phase 1 and Phase 2 together:

1. Remove demo data from authenticated state.
2. Add real empty states.
3. Formalize entry contracts for every current frontend logging flow.
4. Update backend activity summaries for all supported frontend entry types.

This gives the team a more honest app quickly: it may have fewer fake insights, but every visible saved value will have a real source of truth.
