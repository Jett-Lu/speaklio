import assert from "node:assert/strict";
import test from "node:test";
import { createRouteTestServer, type MockQuery } from "../test/testServer.js";

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

function hasOperation(query: MockQuery, method: string, firstArg: unknown) {
  return query.operations.some((operation) => (
    operation.method === method && operation.args[0] === firstArg
  ));
}

test("PATCH /me/profile persists nested profile fields", async () => {
  let updateBody: unknown;
  const server = await createRouteTestServer({
    profiles(query) {
      updateBody = query.body;
      return {
        data: {
          id: "user-1",
          display_name: "Sam Reader",
          email: "test@example.com",
          avatar_url: null,
          timezone: "America/Toronto",
          personal_data: { age: 30, heightCm: 170, weightKg: 70, activityLevel: "active" },
          goals: { primaryGoal: "maintain", targetWeightKg: 70, calorieGoal: 2100, proteinGoal: 120, hydrationGoal: 2600, weeklyWorkouts: 4, monthlyBudget: 1800 },
          preferences: { units: "Metric", notifications: true },
          created_at: "2026-07-18T00:00:00.000Z",
          updated_at: "2026-07-18T01:00:00.000Z",
        },
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "Sam Reader",
        timezone: "America/Toronto",
        personal: { age: 30, heightCm: 170, weightKg: 70, activityLevel: "active" },
        goals: { primaryGoal: "maintain", targetWeightKg: 70, calorieGoal: 2100, proteinGoal: 120, hydrationGoal: 2600, weeklyWorkouts: 4, monthlyBudget: 1800 },
        preferences: { units: "Metric", notifications: true },
      }),
    });

    assert.equal(response.status, 200);
    const payload = await json(response);
    assert.equal((payload.profile as Record<string, unknown>).display_name, "Sam Reader");
    assert.deepEqual(updateBody, {
      display_name: "Sam Reader",
      timezone: "America/Toronto",
      personal_data: { age: 30, heightCm: 170, weightKg: 70, activityLevel: "active" },
      goals: { primaryGoal: "maintain", targetWeightKg: 70, calorieGoal: 2100, proteinGoal: 120, hydrationGoal: 2600, weeklyWorkouts: 4, monthlyBudget: 1800 },
      preferences: { units: "Metric", notifications: true },
    });
  } finally {
    await server.close();
  }
});

test("PATCH /me/profile rejects invalid preferences", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: { units: "Kelvin" },
      }),
    });

    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid profile update");
  } finally {
    await server.close();
  }
});

test("authenticated routes reject missing bearer tokens", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await fetch(`${server.baseUrl}/me`);
    assert.equal(response.status, 401);
    const payload = await json(response);
    assert.equal(payload.error, "Missing bearer token");
  } finally {
    await server.close();
  }
});

test("GET /entries applies list filters and pagination", async () => {
  let entryQuery: MockQuery | null = null;
  const server = await createRouteTestServer({
    metric_entries(query) {
      entryQuery = query;
      return {
        data: [{
          id: "entry-1",
          user_id: "user-1",
          plugin_id: "sleep",
          entry_type: "log_sleep",
          value: 420,
          unit: "min",
          metadata: { quality: "Good" },
          occurred_at: "2026-07-18T07:00:00.000Z",
          created_at: "2026-07-18T07:00:00.000Z",
        }],
        error: null,
        count: 1,
      };
    },
  });

  try {
    const response = await server.request("/entries?pluginId=sleep&entryType=log_sleep&limit=5&offset=2");

    assert.equal(response.status, 200);
    const payload = await json(response);
    assert.equal((payload.entries as unknown[]).length, 1);
    assert.ok(entryQuery);
    assert.equal(hasOperation(entryQuery, "eq", "user_id"), true);
    assert.equal(hasOperation(entryQuery, "eq", "plugin_id"), true);
    assert.equal(hasOperation(entryQuery, "eq", "entry_type"), true);
    assert.equal(hasOperation(entryQuery, "range", 2), true);
  } finally {
    await server.close();
  }
});

test("GET /entries rejects invalid filters", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/entries?limit=500");
    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid entry filters");
  } finally {
    await server.close();
  }
});

test("GET /entries/summary aggregates entries by plugin and type", async () => {
  let entryQuery: MockQuery | null = null;
  const server = await createRouteTestServer({
    metric_entries(query) {
      entryQuery = query;
      return {
        data: [
          { id: "food-1", user_id: "user-1", plugin_id: "nutrition", entry_type: "log_food", value: 500, unit: "cal", metadata: { calories: 500, protein: 25, carbs: 40, fats: 15, fiber: 5 }, occurred_at: "2026-07-18T10:00:00.000Z", created_at: "2026-07-18T10:00:00.000Z" },
          { id: "expense-1", user_id: "user-1", plugin_id: "finance", entry_type: "log_expense", value: 25, unit: "usd", metadata: { category: "Dining" }, occurred_at: "2026-07-18T12:00:00.000Z", created_at: "2026-07-18T12:00:00.000Z" },
          { id: "water-1", user_id: "user-1", plugin_id: "hydration", entry_type: "log_hydration", value: 0.5, unit: "l", metadata: {}, occurred_at: "2026-07-18T13:00:00.000Z", created_at: "2026-07-18T13:00:00.000Z" },
          { id: "sleep-1", user_id: "user-1", plugin_id: "sleep", entry_type: "log_sleep", value: 450, unit: "min", metadata: { quality: "Good" }, occurred_at: "2026-07-18T07:00:00.000Z", created_at: "2026-07-18T07:00:00.000Z" },
          { id: "workout-1", user_id: "user-1", plugin_id: "workout", entry_type: "log_workout", value: null, unit: null, metadata: { exercise: "Run", completed: true }, occurred_at: "2026-07-18T09:00:00.000Z", created_at: "2026-07-18T09:00:00.000Z" },
          { id: "workout-2", user_id: "user-1", plugin_id: "workout", entry_type: "log_workout", value: null, unit: null, metadata: { exercise: "Lift" }, occurred_at: "2026-07-19T09:00:00.000Z", created_at: "2026-07-19T09:00:00.000Z" },
          { id: "mind-1", user_id: "user-1", plugin_id: "mindfulness", entry_type: "log_mindfulness", value: 10, unit: "min", metadata: {}, occurred_at: "2026-07-18T14:00:00.000Z", created_at: "2026-07-18T14:00:00.000Z" },
        ],
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/entries/summary?from=2026-07-18T00:00:00.000Z&to=2026-07-19T23:59:59.999Z");

    assert.equal(response.status, 200);
    const payload = await json(response);
    const totals = payload.totals as Record<string, Record<string, unknown> | number>;
    assert.equal(totals.entries, 7);
    assert.equal((totals.nutrition as Record<string, unknown>).calories, 500);
    assert.equal((totals.nutrition as Record<string, unknown>).protein, 25);
    assert.equal((totals.nutrition as Record<string, unknown>).fiber, 5);
    assert.equal((totals.finance as Record<string, unknown>).spending, 25);
    assert.equal((totals.hydration as Record<string, unknown>).ml, 500);
    assert.equal((totals.sleep as Record<string, unknown>).minutes, 450);
    assert.equal((totals.mindfulness as Record<string, unknown>).minutes, 10);
    assert.equal((totals.workouts as Record<string, unknown>).completed, 1);
    assert.equal((totals.workouts as Record<string, unknown>).planned, 1);
    assert.equal(((payload.byPlugin as Record<string, Record<string, unknown>>).workout).count, 2);
    assert.equal(((payload.byEntryType as Record<string, Record<string, unknown>>).log_food).valueTotal, 500);
    assert.ok(entryQuery);
    assert.equal(hasOperation(entryQuery, "eq", "user_id"), true);
    assert.equal(hasOperation(entryQuery, "gte", "occurred_at"), true);
    assert.equal(hasOperation(entryQuery, "lte", "occurred_at"), true);
    assert.equal(hasOperation(entryQuery, "limit", 5000), true);
  } finally {
    await server.close();
  }
});

test("GET /entries/summary rejects invalid windows", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/entries/summary?from=2026-07-20T00:00:00.000Z&to=2026-07-18T00:00:00.000Z");
    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid entry summary filters");
  } finally {
    await server.close();
  }
});

test("POST /entries validates frontend entry contracts before insert", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/entries", {
      method: "POST",
      body: JSON.stringify({
        pluginId: "finance",
        entryType: "log_expense",
        value: 20,
        unit: "usd",
        metadata: {},
      }),
    });

    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid entry");
  } finally {
    await server.close();
  }
});

test("POST /entries creates an entry and activity for valid frontend logs", async () => {
  let insertedEntry: unknown;
  const server = await createRouteTestServer({
    metric_entries(query) {
      insertedEntry = query.body;
      return {
        data: {
          id: "entry-1",
          user_id: "user-1",
          plugin_id: "hydration",
          entry_type: "log_hydration",
          value: 500,
          unit: "ml",
          metadata: {},
          occurred_at: "2026-07-18T12:00:00.000Z",
          created_at: "2026-07-18T12:00:00.000Z",
        },
        error: null,
      };
    },
    activities() {
      return {
        data: {
          id: "activity-1",
          user_id: "user-1",
          plugin_id: "hydration",
          metric_entry_id: "entry-1",
          title: "Added water",
          detail: "500 ml",
          occurred_at: "2026-07-18T12:00:00.000Z",
          created_at: "2026-07-18T12:00:00.000Z",
        },
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/entries", {
      method: "POST",
      body: JSON.stringify({
        pluginId: "hydration",
        entryType: "log_hydration",
        value: 500,
        unit: "ml",
        metadata: {},
        occurredAt: "2026-07-18T12:00:00.000Z",
      }),
    });

    assert.equal(response.status, 201);
    const payload = await json(response);
    assert.equal((payload.entry as Record<string, unknown>).entryType, "log_hydration");
    assert.deepEqual(insertedEntry, {
      user_id: "user-1",
      plugin_id: "hydration",
      entry_type: "log_hydration",
      value: 500,
      unit: "ml",
      metadata: {},
      occurred_at: "2026-07-18T12:00:00.000Z",
    });
  } finally {
    await server.close();
  }
});

test("GET /entries/:id returns 404 when entry is not owned by user", async () => {
  const server = await createRouteTestServer({
    metric_entries() {
      return { data: null, error: null };
    },
  });

  try {
    const response = await server.request("/entries/missing-entry");
    assert.equal(response.status, 404);
    const payload = await json(response);
    assert.equal(payload.error, "Entry not found");
  } finally {
    await server.close();
  }
});

test("PATCH /entries/:id updates only supplied fields", async () => {
  let updateBody: unknown;
  const server = await createRouteTestServer({
    metric_entries(query) {
      updateBody = query.body;
      return {
        data: {
          id: "entry-1",
          user_id: "user-1",
          plugin_id: "sleep",
          entry_type: "log_sleep",
          value: 480,
          unit: "min",
          metadata: { quality: "Great" },
          occurred_at: "2026-07-18T07:00:00.000Z",
          created_at: "2026-07-18T07:00:00.000Z",
        },
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/entries/entry-1", {
      method: "PATCH",
      body: JSON.stringify({
        value: 480,
        metadata: { quality: "Great" },
      }),
    });

    assert.equal(response.status, 200);
    const payload = await json(response);
    assert.equal((payload.entry as Record<string, unknown>).value, 480);
    assert.deepEqual(updateBody, {
      value: 480,
      metadata: { quality: "Great" },
    });
  } finally {
    await server.close();
  }
});

test("DELETE /entries/:id scopes delete to authenticated user", async () => {
  let deleteQuery: MockQuery | null = null;
  const server = await createRouteTestServer({
    metric_entries(query) {
      deleteQuery = query;
      return {
        data: { id: "entry-1" },
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/entries/entry-1", { method: "DELETE" });

    assert.equal(response.status, 204);
    assert.ok(deleteQuery);
    assert.equal(hasOperation(deleteQuery, "delete", undefined), true);
    assert.equal(hasOperation(deleteQuery, "eq", "id"), true);
    assert.equal(hasOperation(deleteQuery, "eq", "user_id"), true);
  } finally {
    await server.close();
  }
});

test("GET /activities applies authenticated user and plugin filters", async () => {
  let activityQuery: MockQuery | null = null;
  const server = await createRouteTestServer({
    activities(query) {
      activityQuery = query;
      return {
        data: [{
          id: "activity-1",
          user_id: "user-1",
          plugin_id: "hydration",
          metric_entry_id: "entry-1",
          title: "Added water",
          detail: "500 ml",
          occurred_at: "2026-07-18T12:00:00.000Z",
          created_at: "2026-07-18T12:00:00.000Z",
        }],
        error: null,
        count: 1,
      };
    },
  });

  try {
    const response = await server.request("/activities?pluginId=hydration&limit=2&offset=1");

    assert.equal(response.status, 200);
    const payload = await json(response);
    assert.equal((payload.activities as unknown[]).length, 1);
    assert.ok(activityQuery);
    assert.equal(hasOperation(activityQuery, "eq", "user_id"), true);
    assert.equal(hasOperation(activityQuery, "eq", "plugin_id"), true);
    assert.equal(hasOperation(activityQuery, "range", 1), true);
  } finally {
    await server.close();
  }
});

test("GET /activities rejects invalid filters", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/activities?offset=-1");
    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid activity filters");
  } finally {
    await server.close();
  }
});

test("GET /integrations returns backend-owned connection status metadata", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/integrations");

    assert.equal(response.status, 200);
    const payload = await json(response);
    const integrations = payload.integrations as Array<Record<string, unknown>>;
    const appleHealth = integrations.find((integration) => integration.id === "apple-health");
    assert.equal(appleHealth?.available, false);
    assert.equal(appleHealth?.status, "coming-soon");
    assert.equal((appleHealth?.permissions as Record<string, unknown>).read, "Steps, workouts, heart rate, sleep, active energy, mindful minutes.");
  } finally {
    await server.close();
  }
});

test("GET /dashboard/summary returns backend-computed card totals", async () => {
  const server = await createRouteTestServer({
    profiles() {
      return {
        data: {
          display_name: "Sam Reader",
          email: "sam@example.com",
          avatar_url: null,
          timezone: "America/Toronto",
          goals: { calorieGoal: 2200, hydrationGoal: 2800, weeklyWorkouts: 5 },
          preferences: { monthlyBudget: 1500 },
        },
        error: null,
      };
    },
    metric_entries() {
      return {
        data: [
          { id: "food-1", plugin_id: "nutrition", entry_type: "log_food", value: 500, unit: "cal", metadata: { food: "breakfast", calories: 500, protein: 25, carbs: 40, fats: 15, fiber: 5 }, occurred_at: "2026-07-18T10:00:00.000Z", created_at: "2026-07-18T10:00:00.000Z" },
          { id: "expense-1", plugin_id: "finance", entry_type: "log_expense", value: 25, unit: "usd", metadata: { category: "Dining" }, occurred_at: "2026-07-18T12:00:00.000Z", created_at: "2026-07-18T12:00:00.000Z" },
          { id: "water-1", plugin_id: "hydration", entry_type: "log_hydration", value: 0.5, unit: "l", metadata: {}, occurred_at: "2026-07-18T13:00:00.000Z", created_at: "2026-07-18T13:00:00.000Z" },
          { id: "sleep-1", plugin_id: "sleep", entry_type: "log_sleep", value: 450, unit: "min", metadata: { quality: "Good" }, occurred_at: "2026-07-18T07:00:00.000Z", created_at: "2026-07-18T07:00:00.000Z" },
          { id: "workout-1", plugin_id: "workout", entry_type: "log_workout", value: null, unit: null, metadata: { exercise: "Run", completed: true }, occurred_at: "2026-07-18T09:00:00.000Z", created_at: "2026-07-18T09:00:00.000Z" },
          { id: "mind-1", plugin_id: "mindfulness", entry_type: "log_mindfulness", value: 10, unit: "min", metadata: {}, occurred_at: "2026-07-18T14:00:00.000Z", created_at: "2026-07-18T14:00:00.000Z" },
        ],
        error: null,
      };
    },
    plugins() {
      return {
        data: [
          { id: "nutrition", name: "Nutrition", description: "Meals", icon: "apple", is_active: true, created_at: "2026-07-18T00:00:00.000Z" },
          { id: "sleep", name: "Sleep", description: "Rest", icon: "moon", is_active: true, created_at: "2026-07-18T00:00:00.000Z" },
        ],
        error: null,
      };
    },
    user_plugins() {
      return {
        data: [{ plugin_id: "sleep", enabled: true }],
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/dashboard/summary?date=2026-07-18");

    assert.equal(response.status, 200);
    const payload = await json(response);
    const summary = payload.summary as Record<string, Record<string, unknown>>;
    assert.equal(summary.nutrition.calories, 500);
    assert.equal(summary.nutrition.protein, 25);
    assert.equal(summary.nutrition.fiber, 5);
    assert.equal(summary.finance.spending, 25);
    assert.equal(summary.finance.budget, 1500);
    assert.equal(summary.hydration.ml, 500);
    assert.equal(summary.sleep.minutes, 450);
    assert.equal(summary.workout.completed, 1);
    assert.equal(summary.mindfulness.count, 1);
    assert.equal((payload.profile as Record<string, unknown>).displayName, "Sam Reader");
    assert.equal(((payload.plugins as Record<string, unknown>).enabled as Array<Record<string, unknown>>)[0].id, "sleep");
    const insights = payload.insights as Record<string, Record<string, unknown>>;
    assert.equal((insights.balance as Record<string, unknown>).score, 51);
    assert.equal((insights.balance as Record<string, unknown>).onTrack, 2);
    assert.equal((insights.nextAction as Record<string, unknown>).title, "Plan protein before dinner");
    assert.equal(insights.readiness, "Steady");
    assert.equal(((insights.attention as Record<string, Record<string, unknown>>).finance).title, "Budget pace");
    assert.equal(((insights.agenda as Record<string, Record<string, unknown>>).workout).meta, "No workout scheduled");
  } finally {
    await server.close();
  }
});

test("GET /dashboard/summary rejects invalid date filters", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/dashboard/summary?date=tomorrow");
    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid dashboard summary filters");
  } finally {
    await server.close();
  }
});

test("GET /plugins merges active plugins with user enablement", async () => {
  const server = await createRouteTestServer({
    plugins() {
      return {
        data: [
          { id: "nutrition", name: "Nutrition", description: "Meals", icon: "apple", is_active: true, created_at: "2026-07-18T00:00:00.000Z" },
          { id: "sleep", name: "Sleep", description: "Rest", icon: "moon", is_active: true, created_at: "2026-07-18T00:00:00.000Z" },
        ],
        error: null,
      };
    },
    user_plugins() {
      return {
        data: [{ plugin_id: "sleep", enabled: true }],
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/plugins");

    assert.equal(response.status, 200);
    const payload = await json(response);
    const plugins = payload.plugins as Array<Record<string, unknown>>;
    assert.equal(plugins.find((plugin) => plugin.id === "nutrition")?.enabled, false);
    assert.equal(plugins.find((plugin) => plugin.id === "sleep")?.enabled, true);
    assert.deepEqual((plugins.find((plugin) => plugin.id === "sleep")?.ui as Record<string, unknown>).qualityOptions, ["Great", "Good", "Fair", "Poor"]);
  } finally {
    await server.close();
  }
});

test("PUT /plugins/:pluginId/enable upserts enabled user setting", async () => {
  let upsertBody: unknown;
  const server = await createRouteTestServer({
    plugins() {
      return {
        data: { id: "hydration", name: "Hydration", description: "Water", icon: "droplet", is_active: true, created_at: "2026-07-18T00:00:00.000Z" },
        error: null,
      };
    },
    user_plugins(query) {
      upsertBody = query.body;
      return { data: null, error: null };
    },
  });

  try {
    const response = await server.request("/plugins/hydration/enable", { method: "PUT" });

    assert.equal(response.status, 200);
    const payload = await json(response);
    assert.equal((payload.plugin as Record<string, unknown>).enabled, true);
    assert.deepEqual(((payload.plugin as Record<string, unknown>).ui as Record<string, unknown>).presetsMl, [250, 500, 750]);
    assert.deepEqual(upsertBody, {
      user_id: "user-1",
      plugin_id: "hydration",
      enabled: true,
    });
  } finally {
    await server.close();
  }
});

test("DELETE /plugins/:pluginId/enable returns 404 for inactive plugins", async () => {
  const server = await createRouteTestServer({
    plugins() {
      return { data: null, error: null };
    },
  });

  try {
    const response = await server.request("/plugins/unknown/enable", { method: "DELETE" });
    assert.equal(response.status, 404);
    const payload = await json(response);
    assert.equal(payload.error, "Plugin not found");
  } finally {
    await server.close();
  }
});

test("POST /ai/preview-entry maps supported actions without calling local AI", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/ai/preview-entry", {
      method: "POST",
      body: JSON.stringify({
        actions: [
          { type: "log_hydration", hydration_amount: 500, hydration_unit: "ml", confidence: 0.9 },
          { type: "log_expense", amount: 12.5, currency: "usd", category: "Dining", confidence: 0.8 },
        ],
      }),
    });

    assert.equal(response.status, 200);
    const payload = await json(response);
    const previews = payload.previews as Array<{ entry: Record<string, unknown> }>;
    assert.equal(previews[0].entry.entryType, "log_hydration");
    assert.equal(previews[1].entry.entryType, "log_expense");
  } finally {
    await server.close();
  }
});

test("POST /ai/preview-entry recovers natural food prompts when local AI omits food fields", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

    if (url.startsWith("http://127.0.0.1:11434")) {
      return new Response(JSON.stringify({
        message: {
          content: JSON.stringify({
            actions: [{ type: "log_food", confidence: 0.4 }],
            needs_confirmation: true,
            message: null,
          }),
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/ai/preview-entry", {
      method: "POST",
      body: JSON.stringify({ text: "I have a chocolate chip cookie today" }),
    });

    assert.equal(response.status, 200);
    const payload = await json(response);
    const previews = payload.previews as Array<{ entry: Record<string, unknown> }>;
    const entry = previews[0].entry;
    assert.equal(entry.entryType, "log_food");
    assert.equal(entry.value, 170);
    assert.deepEqual(entry.metadata, {
      food: "chocolate chip cookie",
      quantity: "estimated single serving",
      meal: "snack",
      calories: 170,
      protein: 2,
      carbs: 24,
      fats: 8,
      fiber: 1,
      estimated: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});

test("POST /ai/confirm-actions rejects invalid proposed entries", async () => {
  const server = await createRouteTestServer({});

  try {
    const response = await server.request("/ai/confirm-actions", {
      method: "POST",
      body: JSON.stringify({
        entries: [
          { pluginId: "finance", entryType: "log_expense", value: 12, unit: "usd", metadata: {} },
        ],
      }),
    });

    assert.equal(response.status, 400);
    const payload = await json(response);
    assert.equal(payload.error, "Invalid confirmed entries");
  } finally {
    await server.close();
  }
});

test("POST /ai/confirm-actions validates and persists proposed entries", async () => {
  let insertedEntries: unknown;
  const server = await createRouteTestServer({
    metric_entries(query) {
      insertedEntries = query.body;
      return {
        data: [{
          id: "entry-1",
          user_id: "user-1",
          plugin_id: "mindfulness",
          entry_type: "log_mindfulness",
          value: 10,
          unit: "min",
          metadata: {},
          occurred_at: "2026-07-18T12:00:00.000Z",
          created_at: "2026-07-18T12:00:00.000Z",
        }],
        error: null,
      };
    },
    activities() {
      return {
        data: {
          id: "activity-1",
          user_id: "user-1",
          plugin_id: "mindfulness",
          metric_entry_id: "entry-1",
          title: "Completed mindful moment",
          detail: "10 min",
          occurred_at: "2026-07-18T12:00:00.000Z",
          created_at: "2026-07-18T12:00:00.000Z",
        },
        error: null,
      };
    },
  });

  try {
    const response = await server.request("/ai/confirm-actions", {
      method: "POST",
      body: JSON.stringify({
        entries: [
          { pluginId: "mindfulness", entryType: "log_mindfulness", value: 10, unit: "min", metadata: {} },
        ],
      }),
    });

    assert.equal(response.status, 201);
    const payload = await json(response);
    assert.equal((payload.entries as unknown[]).length, 1);
    assert.deepEqual(insertedEntries, [{
      user_id: "user-1",
      plugin_id: "mindfulness",
      entry_type: "log_mindfulness",
      value: 10,
      unit: "min",
      metadata: {},
    }]);
  } finally {
    await server.close();
  }
});
