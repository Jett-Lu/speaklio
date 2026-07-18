import { z } from "zod";

interface EntryContractInput {
  entryType: string;
  value?: number | null;
  unit?: string | null;
  metadata: Record<string, unknown>;
}

function hasMetadataString(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "string" && metadata[key].trim().length > 0;
}

function hasMetadataBoolean(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "boolean";
}

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function validateEntryByType(entry: EntryContractInput, context: z.RefinementCtx) {
  if (entry.entryType === "log_weight") {
    if (entry.value === undefined || entry.value === null) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Weight logs require a numeric value",
      });
    }

    if (!entry.unit || !["kg", "lb"].includes(entry.unit)) {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Weight logs require unit kg or lb",
      });
    }
  }

  if (entry.entryType === "log_calories") {
    if (entry.value === undefined || entry.value === null) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Calorie logs require a numeric value",
      });
    }

    if (entry.unit && entry.unit !== "cal") {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Calorie logs should use unit cal",
      });
    }
  }

  if (entry.entryType === "log_workout" && !hasMetadataString(entry.metadata, "exercise")) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "exercise"],
      message: "Workout logs require metadata.exercise",
    });
  }

  if (entry.entryType === "log_food") {
    if (!hasMetadataString(entry.metadata, "food")) {
      context.addIssue({
        code: "custom",
        path: ["metadata", "food"],
        message: "Food logs require metadata.food",
      });
    }

    if (!isPositiveNumber(entry.value) && !isPositiveNumber(entry.metadata.calories)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Food logs require a positive calorie value",
      });
    }

    if (entry.unit && entry.unit !== "cal") {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Food logs should use unit cal",
      });
    }
  }

  if (entry.entryType === "log_expense") {
    if (!isPositiveNumber(entry.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Expense logs require a positive numeric value",
      });
    }

    if (entry.unit && !["usd", "cad"].includes(entry.unit.toLowerCase())) {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Expense logs should use unit usd or cad",
      });
    }

    if (!hasMetadataString(entry.metadata, "category")) {
      context.addIssue({
        code: "custom",
        path: ["metadata", "category"],
        message: "Expense logs require metadata.category",
      });
    }
  }

  if (entry.entryType === "log_sleep") {
    if (!isPositiveNumber(entry.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Sleep logs require minutes slept as a positive numeric value",
      });
    }

    if (entry.unit && entry.unit !== "min") {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Sleep logs should use unit min",
      });
    }
  }

  if (entry.entryType === "log_hydration") {
    if (!isPositiveNumber(entry.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Hydration logs require a positive numeric value",
      });
    }

    if (entry.unit && !["ml", "l", "oz"].includes(entry.unit.toLowerCase())) {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Hydration logs should use unit ml, l, or oz",
      });
    }
  }

  if (entry.entryType === "log_mindfulness") {
    if (!isPositiveNumber(entry.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Mindfulness logs require minutes as a positive numeric value",
      });
    }

    if (entry.unit && entry.unit !== "min") {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Mindfulness logs should use unit min",
      });
    }
  }

  if (entry.entryType === "log_workout" && entry.metadata.completed !== undefined && !hasMetadataBoolean(entry.metadata, "completed")) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "completed"],
      message: "Workout metadata.completed must be boolean when provided",
    });
  }
}

export const createEntrySchema = z.object({
  pluginId: z.string().trim().min(1).max(80).nullable().optional(),
  entryType: z.string().trim().min(1).max(80),
  value: z.number().nullable().optional(),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime({ offset: true }).optional(),
}).superRefine(validateEntryByType);
