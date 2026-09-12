# Speaklio

Speaklio is a browser-local personal tracking dashboard for meals, expenses, sleep, workouts, hydration, and mindful moments. Use the plugin forms or type supported logging requests into the local assistant.

## Run locally

Install Node.js 24 or newer, then run from the repository root:

```sh
node frontend/server.js
```

Open [Speaklio](http://127.0.0.1:4173). No package installation, account, API keys, Docker, Supabase, or AI model is required for the frontend.

Use the server rather than opening `index.html` directly: the frontend uses ES modules. You can also run `npm start`. Set `PORT` to use another port; the preview binds to this computer only.

## What works

- Add or remove tracking plugins from your dashboard.
- Log meals, expenses, sleep, workouts, water, and mindful moments.
- Edit your profile, personal details, goals, and dashboard preferences.
- Search and filter activity, clear the timeline, export JSON, or reset local data.
- Type commands such as `I drank 500 ml of water`, `I spent 12 on lunch`, or `I slept 8 hours` after adding the relevant plugin.
- Use browser speech recognition when available. Typing works without microphone access.

The assistant matches supported phrases; it does not call an LLM. Recognized logging requests save immediately. Use the forms when you need precise values.

## Data and limitations

Data stays in localStorage for this browser and origin. A different browser, hostname, or port has separate data. Clearing browser storage removes it. Export important data before clearing storage or changing origins; JSON import is not implemented.

This is a local prototype, not a complete historical tracking system. Dashboard counters persist until reset; they do not automatically roll over at day/week/month boundaries. Individual entry editing/deletion and assistant corrections are not available. Clearing the timeline does not change dashboard totals.

Apple Health/Watch sync and camera nutrition recognition are placeholders. Notification switches store preferences but do not send notifications. Some unit/timezone preferences are stored without changing all displayed values. Voice recognition may use the browser provider's service; Google Fonts also makes external requests. Core typed logging does not require a backend.

## Code layout

| File | Responsibility |
| --- | --- |
| `frontend/index.html` / `styles.css` | Page structure and responsive styling |
| `frontend/app.js` | DOM rendering, forms, navigation, and event wiring |
| `frontend/state.mjs` | Defaults, browser persistence, export shape, and reset |
| `frontend/catalog.mjs` | Plugin definitions, icons, and placeholder integrations |
| `frontend/format.mjs` | Formatting and profile goal helpers |
| `frontend/assistant.mjs` | Local command matching and dashboard answers |
| `frontend/server.js` | Dependency-free local static preview |
| `frontend/tests/` | Node regression tests |

## Check changes

```sh
node --test frontend/tests/*.test.*
```

Follow the [frontend smoke checklist](docs/frontend-smoke-checklist.md) after changing interactive flows.

## Historical backend work

`backend/`, `supabase/`, `local_ai/`, and their architecture/setup notes remain as historical reference. They are not used by the standalone frontend. Their services and cloud configuration have not been verified, and their old root npm scripts are no longer part of the active setup. See the [documentation index](docs/README.md).
