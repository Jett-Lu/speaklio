import { supabaseAdmin } from "./supabase.js";

const activitySelect = "id, user_id, plugin_id, metric_entry_id, title, detail, occurred_at, created_at";

export interface ActivityRow {
  id: unknown;
  user_id: unknown;
  plugin_id: unknown;
  metric_entry_id: unknown;
  title: unknown;
  detail: unknown;
  occurred_at: unknown;
  created_at: unknown;
}

export function toActivityResponse(activity: ActivityRow) {
  return {
    id: activity.id,
    userId: activity.user_id,
    pluginId: activity.plugin_id,
    metricEntryId: activity.metric_entry_id,
    title: activity.title,
    detail: activity.detail,
    occurredAt: activity.occurred_at,
    createdAt: activity.created_at,
  };
}

export function summarizeEntry(entry: Record<string, unknown>) {
  const metadata = entry.metadata && typeof entry.metadata === "object"
    ? entry.metadata as Record<string, unknown>
    : {};
  const entryType = String(entry.entry_type);
  const value = typeof entry.value === "number" || typeof entry.value === "string" ? Number(entry.value) : null;

  if (entryType === "log_workout") {
    const exercise = typeof metadata.exercise === "string" ? metadata.exercise : "workout";
    const sets = typeof metadata.sets === "number" ? `${metadata.sets} sets` : null;
    const reps = typeof metadata.reps === "number" ? `${metadata.reps} reps` : null;
    const load = typeof metadata.load === "number"
      ? `${metadata.load} ${typeof metadata.loadUnit === "string" ? metadata.loadUnit : ""}`.trim()
      : null;
    const duration = typeof metadata.duration === "number"
      ? `${metadata.duration} min`
      : typeof metadata.durationMinutes === "number"
        ? `${metadata.durationMinutes} min`
        : null;
    const plannedTime = typeof metadata.plannedTime === "string" ? metadata.plannedTime : null;
    const completed = metadata.completed === true;

    return {
      title: completed ? `Completed ${exercise}` : `Logged ${exercise}`,
      detail: [sets, reps, load, duration, plannedTime].filter(Boolean).join(" - ") || "Workout logged",
    };
  }

  if (entryType === "log_food") {
    const food = typeof metadata.food === "string" ? metadata.food : "food";
    const meal = typeof metadata.meal === "string" ? metadata.meal : null;
    const calories = value !== null && Number.isFinite(value) ? `${value} ${entry.unit ?? "cal"}` : null;
    return {
      title: `Logged ${food}`,
      detail: [meal || "Meal", calories].filter(Boolean).join(" - ") || "Food logged",
    };
  }

  if (entryType === "log_calories") {
    return {
      title: "Logged calories",
      detail: `${entry.value ?? "Unknown"} ${entry.unit ?? "cal"}`,
    };
  }

  if (entryType === "log_weight") {
    return {
      title: "Logged weight",
      detail: `${entry.value ?? "Unknown"} ${entry.unit ?? ""}`.trim(),
    };
  }

  if (entryType === "log_expense") {
    const category = typeof metadata.category === "string" ? metadata.category : "Expense";
    const note = typeof metadata.note === "string" ? metadata.note : category;
    const amount = value !== null && Number.isFinite(value) ? `$${value.toFixed(2)}` : "Unknown amount";
    return {
      title: `Added ${note}`,
      detail: `${category} - ${amount}`,
    };
  }

  if (entryType === "log_sleep") {
    const quality = typeof metadata.quality === "string" ? ` - ${metadata.quality} quality` : "";
    return {
      title: "Updated sleep summary",
      detail: value !== null && Number.isFinite(value) ? `${Math.floor(value / 60)}h ${value % 60}m${quality}` : `Sleep logged${quality}`,
    };
  }

  if (entryType === "log_hydration") {
    return {
      title: "Added water",
      detail: `${entry.value ?? "Unknown"} ${entry.unit ?? "ml"}`,
    };
  }

  if (entryType === "log_mindfulness") {
    return {
      title: "Completed mindful moment",
      detail: `${entry.value ?? "Unknown"} ${entry.unit ?? "min"}`,
    };
  }

  return {
    title: `Logged ${entryType.replaceAll("_", " ")}`,
    detail: "Entry added",
  };
}

export async function createActivityForEntry(entry: Record<string, unknown>) {
  const summary = summarizeEntry(entry);
  const { data, error } = await supabaseAdmin
    .from("activities")
    .insert({
      user_id: entry.user_id,
      plugin_id: entry.plugin_id,
      metric_entry_id: entry.id,
      title: summary.title,
      detail: summary.detail,
      occurred_at: entry.occurred_at,
    })
    .select(activitySelect)
    .single();

  return { data, error };
}
