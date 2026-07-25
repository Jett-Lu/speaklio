import assert from "node:assert/strict";
import test from "node:test";
import { createEntrySchema } from "./entryContracts.js";

test("entry contracts accept current frontend-written entry types", () => {
  const cases = [
    { pluginId: "finance", entryType: "log_expense", value: 18.5, unit: "usd", metadata: { category: "Dining" } },
    { pluginId: "sleep", entryType: "log_sleep", value: 450, unit: "min", metadata: { quality: "Good" } },
    { pluginId: "hydration", entryType: "log_hydration", value: 500, unit: "ml", metadata: {} },
    { pluginId: "mindfulness", entryType: "log_mindfulness", value: 10, unit: "min", metadata: {} },
    { pluginId: "workout", entryType: "log_workout", metadata: { exercise: "Mobility", completed: false } },
    { pluginId: "nutrition", entryType: "log_food", value: 320, unit: "cal", metadata: { food: "eggs", calories: 320, protein: 18, carbs: 2, fats: 22, fiber: 0, estimated: true } },
  ];

  cases.forEach((entry) => {
    assert.equal(createEntrySchema.safeParse(entry).success, true, entry.entryType);
  });
});

test("entry contracts reject invalid metadata and units", () => {
  const cases = [
    { entryType: "log_expense", value: -1, unit: "usd", metadata: { category: "Dining" } },
    { entryType: "log_expense", value: 10, unit: "eur", metadata: { category: "Dining" } },
    { entryType: "log_expense", value: 10, unit: "usd", metadata: {} },
    { entryType: "log_sleep", value: 420, unit: "hours", metadata: {} },
    { entryType: "log_hydration", value: 8, unit: "cups", metadata: {} },
    { entryType: "log_mindfulness", value: 0, unit: "min", metadata: {} },
    { entryType: "log_workout", metadata: { exercise: "Mobility", completed: "yes" } },
    { entryType: "log_food", unit: "cal", metadata: { food: "ice cream" } },
    { entryType: "log_food", value: 150, unit: "kcal", metadata: { food: "ice cream", calories: 150 } },
  ];

  cases.forEach((entry) => {
    assert.equal(createEntrySchema.safeParse(entry).success, false, entry.entryType);
  });
});
