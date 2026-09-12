# Speaklio Frontend

A dependency-free, browser-local dashboard built with HTML, CSS, and JavaScript ES modules.

## Preview

From the repository root:

```sh
node frontend/server.js
```

Open [the local preview](http://127.0.0.1:4173). Do not open `index.html` directly. No login or runtime configuration file is needed.

## Development

- Keep DOM and form wiring in `app.js`.
- Keep persistence and defaults in `state.mjs`.
- Keep plugin definitions in `catalog.mjs` and formatting in `format.mjs`.
- Keep command matching in `assistant.mjs`; UI callbacks are passed into `createAssistant`.
- Use `escapeHtml` for user content interpolated into HTML.
- Chat messages and activity searches already update only their relevant sections; use focused rendering for similar interactions.
- When adding an asset, add it to the explicit public asset list in `server.js`.

Run `node --test frontend/tests/*.test.*` from the root, then follow the [smoke checklist](../docs/frontend-smoke-checklist.md).

See the [root README](../README.md) for supported commands, storage behavior, and prototype limitations.
