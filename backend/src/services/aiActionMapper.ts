import type { LocalAiAction } from "./localAiParser.js";

export interface ProposedEntry {
  pluginId: string | null;
  entryType: string;
  value: number | null;
  unit: string | null;
  metadata: Record<string, unknown>;
  occurredAt?: string;
}

export interface ActionPreview {
  action: LocalAiAction;
  entry: ProposedEntry | null;
  reason: string | null;
}

function withDate(action: LocalAiAction, entry: Omit<ProposedEntry, "occurredAt">): ProposedEntry {
  return {
    ...entry,
    ...(action.date ? { occurredAt: action.date } : {}),
  };
}

export function mapActionToEntry(action: LocalAiAction): ActionPreview {
  if (action.type === "log_workout") {
    if (!action.exercise) {
      return { action, entry: null, reason: "Workout logs need an exercise name" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "workout",
        entryType: "log_workout",
        value: null,
        unit: null,
        metadata: {
          exercise: action.exercise,
          ...(action.sets !== undefined && action.sets !== null ? { sets: action.sets } : {}),
          ...(action.reps !== undefined && action.reps !== null ? { reps: action.reps } : {}),
          ...(action.load !== undefined && action.load !== null ? { load: action.load } : {}),
          ...(action.load_unit ? { loadUnit: action.load_unit } : {}),
          ...(action.duration_minutes !== undefined && action.duration_minutes !== null
            ? { durationMinutes: action.duration_minutes }
            : {}),
        },
      }),
    };
  }

  if (action.type === "log_calories") {
    if (action.calories === undefined || action.calories === null) {
      return { action, entry: null, reason: "Calorie logs need a calorie number" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "nutrition",
        entryType: "log_calories",
        value: action.calories,
        unit: "cal",
        metadata: {},
      }),
    };
  }

  if (action.type === "log_food") {
    if (!action.food) {
      return { action, entry: null, reason: "Food logs need a food name" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "nutrition",
        entryType: "log_food",
        value: action.calories ?? null,
        unit: action.calories !== undefined && action.calories !== null ? "cal" : null,
        metadata: {
          food: action.food,
          ...(action.quantity ? { quantity: action.quantity } : {}),
          ...(action.meal ? { meal: action.meal } : {}),
        },
      }),
    };
  }

  if (action.type === "log_weight") {
    if (action.weight === undefined || action.weight === null) {
      return { action, entry: null, reason: "Weight logs need a weight value" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "nutrition",
        entryType: "log_weight",
        value: action.weight,
        unit: action.weight_unit ?? null,
        metadata: {},
      }),
    };
  }

  if (action.type === "set_weight_goal") {
    if (action.target_weight === undefined || action.target_weight === null) {
      return { action, entry: null, reason: "Weight goals need a target weight" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "nutrition",
        entryType: "set_weight_goal",
        value: action.target_weight,
        unit: action.weight_unit ?? null,
        metadata: {
          ...(action.current_weight !== undefined && action.current_weight !== null
            ? { currentWeight: action.current_weight }
            : {}),
          ...(action.goal_type ? { goalType: action.goal_type } : {}),
          ...(action.timeline ? { timeline: action.timeline } : {}),
        },
      }),
    };
  }

  return {
    action,
    entry: null,
    reason: `Action type ${action.type} is not mapped to a metric entry yet`,
  };
}

export function mapActionsToEntries(actions: LocalAiAction[]) {
  return actions.map(mapActionToEntry);
}
