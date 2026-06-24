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

function summarizeEntry(entry: Record<string, unknown>) {
  const metadata = entry.metadata && typeof entry.metadata === "object"
    ? entry.metadata as Record<string, unknown>
    : {};
  const entryType = String(entry.entry_type);

  if (entryType === "log_workout") {
    const exercise = typeof metadata.exercise === "string" ? metadata.exercise : "workout";
    const sets = typeof metadata.sets === "number" ? `${metadata.sets} sets` : null;
    const reps = typeof metadata.reps === "number" ? `${metadata.reps} reps` : null;
    const load = typeof metadata.load === "number"
      ? `${metadata.load} ${typeof metadata.loadUnit === "string" ? metadata.loadUnit : ""}`.trim()
      : null;
    return {
      title: `Logged ${exercise}`,
      detail: [sets, reps, load].filter(Boolean).join(" - ") || "Workout logged",
    };
  }

  if (entryType === "log_food") {
    const food = typeof metadata.food === "string" ? metadata.food : "food";
    const meal = typeof metadata.meal === "string" ? metadata.meal : null;
    return {
      title: `Logged ${food}`,
      detail: meal ? `Meal - ${meal}` : "Food logged",
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
