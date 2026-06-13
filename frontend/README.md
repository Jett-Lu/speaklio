# Speaklio Frontend

This is the current static Speaklio prototype. It is a mobile-first personal care dashboard showing how a voice-first AI assistant could turn natural language into structured updates across modular plugins.

## Preview

Open `index.html` directly or run the local static server from the repository root:

```powershell
node frontend/server.js
```

Then visit `http://localhost:4173`.

You can also run the server from this directory:

```powershell
node server.js
```

## Mock Features

- Responsive daily dashboard for nutrition, finance, sleep, and workouts.
- Plugin store with working add and remove interactions.
- Detail sheets for logging meals, expenses, sleep, workouts, water, and mindful moments.
- Activity timeline with plugin filters and history controls.
- Offline assistant requests with optional browser speech recognition.
- Local browser persistence, data export, profile editing, and preferences.
- Phone-friendly bottom navigation and assistant sheet.

All demo data stays in browser local storage. No account, AI, health, or finance API is required.

## Notes

- This frontend is a prototype and may be rewritten later.
- Keep new frontend assumptions lightweight until the backend and product model settle.
