import assert from "node:assert/strict";
import test from "node:test";
import { mapActionsToEntries } from "./aiActionMapper.js";

test("AI mapper converts dashboard plugin actions to proposed entries", () => {
  const previews = mapActionsToEntries([
    { type: "log_food", food: "ice cream", meal: "snack", calories: 150, protein: 3, carbs: 20, fats: 7, fiber: 1, nutrition_estimated: true, confidence: 0.9 },
    { type: "log_expense", amount: 18.75, currency: "usd", category: "Dining", note: "Lunch", confidence: 0.9 },
    { type: "log_sleep", sleep_minutes: 450, sleep_quality: "Good", confidence: 0.9 },
    { type: "log_hydration", hydration_amount: 500, hydration_unit: "ml", confidence: 0.9 },
    { type: "log_mindfulness", mindfulness_minutes: 10, mindfulness_title: "Breathing", confidence: 0.9 },
  ]);

  assert.deepEqual(previews.map((preview) => preview.entry?.entryType), [
    "log_food",
    "log_expense",
    "log_sleep",
    "log_hydration",
    "log_mindfulness",
  ]);
  assert.deepEqual(previews[0].entry?.metadata, {
    food: "ice cream",
    meal: "snack",
    calories: 150,
    protein: 3,
    carbs: 20,
    fats: 7,
    fiber: 1,
    estimated: true,
  });
  assert.equal(previews[0].entry?.value, 150);
  assert.equal(previews[0].entry?.unit, "cal");
  assert.equal(previews[1].entry?.metadata.note, "Lunch");
  assert.equal(previews[2].entry?.metadata.quality, "Good");
  assert.equal(previews[3].entry?.unit, "ml");
  assert.equal(previews[4].entry?.metadata.title, "Breathing");
});

test("AI mapper returns reasons for incomplete actions", () => {
  const previews = mapActionsToEntries([
    { type: "log_expense", amount: 18.75, confidence: 0.9 },
    { type: "log_sleep", confidence: 0.9 },
    { type: "log_food", food: "ice cream", confidence: 0.9 },
    { type: "unknown", confidence: 0.1 },
  ]);

  assert.equal(previews[0].entry, null);
  assert.match(previews[0].reason || "", /category/);
  assert.equal(previews[1].entry, null);
  assert.match(previews[1].reason || "", /minutes/);
  assert.equal(previews[2].entry, null);
  assert.match(previews[2].reason || "", /calorie/);
  assert.equal(previews[3].entry, null);
  assert.match(previews[3].reason || "", /not mapped/);
});
