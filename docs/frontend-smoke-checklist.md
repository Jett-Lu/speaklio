# Frontend Smoke Checklist

Start `node frontend/server.js` and use `http://127.0.0.1:4173`. Test with a disposable browser profile so resets do not affect personal data.

- Open a fresh page: the dashboard appears immediately without a sign-in screen or API errors.
- Add Hydration in Plugins, open it, and add 250 ml. Confirm the total and a new activity row.
- Type `I drank 500 ml of water` into the assistant. Confirm the total reaches 750 ml and the assistant reports success.
- Reload. Confirm the plugin, total, and activity remain saved.
- Add Nutrition and Finance; save a meal and expense through their forms. Confirm totals and activity change once.
- Open Profile, edit the name/email, and retune the plan. Confirm saving does not request sign-in and changes survive reload.
- Open Activity, search for water, and try the plugin filters. Clear the timeline and confirm totals remain unchanged.
- Open Privacy and data, export JSON, and inspect the saved totals and plugin list.
- Cancel a data reset and confirm data remains. Confirm a reset and reload; defaults should remain.
- At a phone-sized viewport, use bottom navigation, open/close the assistant, and save a form without horizontal overflow.
- Check browser console errors. Requests to a local API, Supabase, or Ollama should not occur.
- If supported, separately test voice input with microphone permission and with permission denied. Typed commands must remain usable.

Known limits: no individual entry edit/delete, JSON import, automatic date rollover, health sync, or generated AI responses. Notification preferences do not schedule messages.
