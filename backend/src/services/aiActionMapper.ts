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

    if (action.calories === undefined || action.calories === null) {
      return { action, entry: null, reason: "Food logs need a calorie number" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "nutrition",
        entryType: "log_food",
        value: action.calories,
        unit: "cal",
        metadata: {
          food: action.food,
          ...(action.quantity ? { quantity: action.quantity } : {}),
          ...(action.meal ? { meal: action.meal } : {}),
          ...(action.calories !== undefined && action.calories !== null ? { calories: action.calories } : {}),
          ...(action.protein !== undefined && action.protein !== null ? { protein: action.protein } : {}),
          ...(action.carbs !== undefined && action.carbs !== null ? { carbs: action.carbs } : {}),
          ...(action.fats !== undefined && action.fats !== null ? { fats: action.fats } : {}),
          ...(action.fiber !== undefined && action.fiber !== null ? { fiber: action.fiber } : {}),
          ...(action.nutrition_estimated !== undefined && action.nutrition_estimated !== null
            ? { estimated: action.nutrition_estimated }
            : {}),
        },
      }),
    };
  }

  if (action.type === "log_expense") {
    if (action.amount === undefined || action.amount === null) {
      return { action, entry: null, reason: "Expense logs need an amount" };
    }

    if (!action.category) {
      return { action, entry: null, reason: "Expense logs need a category" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "finance",
        entryType: "log_expense",
        value: action.amount,
        unit: action.currency ?? "usd",
        metadata: {
          category: action.category,
          ...(action.note ? { note: action.note } : {}),
        },
      }),
    };
  }

  if (action.type === "log_sleep") {
    if (action.sleep_minutes === undefined || action.sleep_minutes === null) {
      return { action, entry: null, reason: "Sleep logs need minutes slept" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "sleep",
        entryType: "log_sleep",
        value: action.sleep_minutes,
        unit: "min",
        metadata: {
          ...(action.sleep_quality ? { quality: action.sleep_quality } : {}),
        },
      }),
    };
  }

  if (action.type === "log_hydration") {
    if (action.hydration_amount === undefined || action.hydration_amount === null) {
      return { action, entry: null, reason: "Hydration logs need an amount" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "hydration",
        entryType: "log_hydration",
        value: action.hydration_amount,
        unit: action.hydration_unit ?? "ml",
        metadata: {},
      }),
    };
  }

  if (action.type === "log_mindfulness") {
    if (action.mindfulness_minutes === undefined || action.mindfulness_minutes === null) {
      return { action, entry: null, reason: "Mindfulness logs need minutes" };
    }

    return {
      action,
      reason: null,
      entry: withDate(action, {
        pluginId: "mindfulness",
        entryType: "log_mindfulness",
        value: action.mindfulness_minutes,
        unit: "min",
        metadata: {
          ...(action.mindfulness_title ? { title: action.mindfulness_title } : {}),
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
