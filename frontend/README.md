# Speaklio Frontend

This is the current Speaklio frontend. It is a mobile-first personal care dashboard showing how a voice-first AI assistant turns natural language into structured updates across modular plugins.

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

## Product Surfaces

- Responsive daily dashboard for nutrition, finance, sleep, and workouts.
- Plugin store with working add and remove interactions.
- Detail sheets for logging meals, expenses, sleep, workouts, water, and mindful moments.
- Activity timeline with plugin filters and history controls.
- Assistant requests with optional browser speech recognition.
- Browser persistence, data export, profile editing, and preferences.
- Phone-friendly bottom navigation and assistant sheet.

## Notes

- Keep new frontend assumptions lightweight until the backend and product model settle.
