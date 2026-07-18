import assert from "node:assert/strict";
import test from "node:test";
import { summarizeEntry } from "./entryActivity.js";

test("activity summaries cover frontend-written entry types", () => {
  assert.deepEqual(summarizeEntry({
    entry_type: "log_expense",
    value: 12.5,
    unit: "usd",
    metadata: { category: "Dining", note: "Lunch" },
  }), {
    title: "Added Lunch",
    detail: "Dining - $12.50",
  });

  assert.deepEqual(summarizeEntry({
    entry_type: "log_sleep",
    value: 455,
    unit: "min",
    metadata: { quality: "Good" },
  }), {
    title: "Updated sleep summary",
    detail: "7h 35m - Good quality",
  });

  assert.deepEqual(summarizeEntry({
    entry_type: "log_hydration",
    value: 500,
    unit: "ml",
    metadata: {},
  }), {
    title: "Added water",
    detail: "500 ml",
  });

  assert.deepEqual(summarizeEntry({
    entry_type: "log_mindfulness",
    value: 10,
    unit: "min",
    metadata: {},
  }), {
    title: "Completed mindful moment",
    detail: "10 min",
  });
});

test("activity summaries distinguish planned and completed workouts", () => {
  assert.deepEqual(summarizeEntry({
    entry_type: "log_workout",
    metadata: { exercise: "Mobility", plannedTime: "Tomorrow", duration: 30, completed: false },
  }), {
    title: "Logged Mobility",
    detail: "30 min - Tomorrow",
  });

  assert.deepEqual(summarizeEntry({
    entry_type: "log_workout",
    metadata: { exercise: "Mobility", durationMinutes: 30, completed: true },
  }), {
    title: "Completed Mobility",
    detail: "30 min",
  });
});
