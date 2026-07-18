import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

export const dashboardRouter = Router();

const entrySelect = "id, plugin_id, entry_type, value, unit, metadata, occurred_at, created_at";
const profileSelect = "goals, preferences";

const summaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function dateWindow(dateText?: string) {
  const base = dateText ? new Date(`${dateText}T00:00:00.000Z`) : new Date();
  const dayStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  dayEnd.setUTCMilliseconds(dayEnd.getUTCMilliseconds() - 1);

  const weekStart = new Date(dayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  const monthStart = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1));
  const rangeStart = weekStart < monthStart ? weekStart : monthStart;

  return { dayStart, dayEnd, weekStart, monthStart, rangeStart };
}

function metadataOf(entry: Record<string, unknown>) {
  return entry.metadata && typeof entry.metadata === "object"
    ? entry.metadata as Record<string, unknown>
    : {};
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function occurredAt(entry: Record<string, unknown>) {
  return new Date(String(entry.occurred_at ?? entry.created_at));
}

function inWindow(entry: Record<string, unknown>, from: Date, to: Date) {
  const occurred = occurredAt(entry);
  return occurred >= from && occurred <= to;
}

function hydrationMl(entry: Record<string, unknown>) {
  const amount = numberValue(entry.value);
  const unit = String(entry.unit ?? "ml").toLowerCase();
  if (unit === "l") return amount * 1000;
  if (unit === "oz") return amount * 29.5735;
  return amount;
}

function buildSleepWeek(entries: Record<string, unknown>[], weekStart: Date, dayEnd: Date) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(weekStart);
    start.setUTCDate(start.getUTCDate() + index);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
    return { start, end, minutes: 0 };
  });

  entries
    .filter((entry) => entry.entry_type === "log_sleep" && inWindow(entry, weekStart, dayEnd))
    .forEach((entry) => {
      const day = days.find((item) => inWindow(entry, item.start, item.end));
      if (day) day.minutes = numberValue(entry.value, day.minutes);
    });

  return days.map((day) => day.minutes);
}

function buildSummary(entries: Record<string, unknown>[], profile: Record<string, unknown> | null, windows: ReturnType<typeof dateWindow>) {
  const goals = profile?.goals && typeof profile.goals === "object"
    ? profile.goals as Record<string, unknown>
    : {};
  const preferences = profile?.preferences && typeof profile.preferences === "object"
    ? profile.preferences as Record<string, unknown>
    : {};

  const summary = {
    nutrition: {
      calories: 0,
      goal: numberValue(goals.calorieGoal, 2100),
      protein: 0,
      carbs: 0,
      fats: 0,
    },
    finance: {
      spending: 0,
      budget: numberValue(preferences.monthlyBudget ?? goals.monthlyBudget, 2000),
    },
    sleep: {
      minutes: 0,
      quality: "Not logged",
      week: buildSleepWeek(entries, windows.weekStart, windows.dayEnd),
    },
    workout: {
      title: "No workout planned",
      time: "Not scheduled",
      duration: 0,
      completed: 0,
      goal: numberValue(goals.weeklyWorkouts, 4),
    },
    hydration: {
      ml: 0,
      goal: numberValue(goals.hydrationGoal, 2700),
    },
    mindfulness: {
      count: 0,
      title: "Mindful moment",
      duration: 10,
    },
  };

  const sortedEntries = [...entries].sort((a, b) => occurredAt(b).getTime() - occurredAt(a).getTime());

  sortedEntries.forEach((entry) => {
    const metadata = metadataOf(entry);
    const isToday = inWindow(entry, windows.dayStart, windows.dayEnd);
    const isThisWeek = inWindow(entry, windows.weekStart, windows.dayEnd);
    const isThisMonth = inWindow(entry, windows.monthStart, windows.dayEnd);

    if (entry.entry_type === "log_food" && isToday) {
      summary.nutrition.calories += numberValue(metadata.calories ?? entry.value);
      summary.nutrition.protein += numberValue(metadata.protein);
      summary.nutrition.carbs += numberValue(metadata.carbs);
      summary.nutrition.fats += numberValue(metadata.fats);
    }

    if (entry.entry_type === "log_calories" && isToday) {
      summary.nutrition.calories += numberValue(entry.value);
    }

    if (entry.entry_type === "log_expense" && isThisMonth) {
      summary.finance.spending += numberValue(entry.value);
    }

    if (entry.entry_type === "log_hydration" && isToday) {
      summary.hydration.ml += hydrationMl(entry);
    }

    if (entry.entry_type === "log_mindfulness" && isThisWeek) {
      summary.mindfulness.count += 1;
      summary.mindfulness.duration = numberValue(entry.value, summary.mindfulness.duration);
    }

    if (entry.entry_type === "log_workout") {
      if (metadata.completed === true && isThisWeek) {
        summary.workout.completed += 1;
      }

      if (summary.workout.title === "No workout planned" && metadata.completed !== true) {
        summary.workout.title = stringValue(metadata.title ?? metadata.exercise, summary.workout.title);
        summary.workout.time = stringValue(metadata.plannedTime, summary.workout.time);
        summary.workout.duration = numberValue(metadata.duration ?? metadata.durationMinutes, summary.workout.duration);
      }
    }
  });

  const latestSleep = sortedEntries.find((entry) => entry.entry_type === "log_sleep");
  if (latestSleep) {
    const metadata = metadataOf(latestSleep);
    summary.sleep.minutes = numberValue(latestSleep.value);
    summary.sleep.quality = stringValue(metadata.quality, summary.sleep.quality);
  }

  return summary;
}

dashboardRouter.get("/summary", requireAuth, async (request, response, next) => {
  try {
    const parsed = summaryQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid dashboard summary filters",
        issues: parsed.error.issues,
      });
      return;
    }

    const windows = dateWindow(parsed.data.date);
    const { user } = request as AuthenticatedRequest;
    const [{ data: profile, error: profileError }, { data: entries, error: entriesError }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(profileSelect)
        .eq("id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("metric_entries")
        .select(entrySelect)
        .eq("user_id", user.id)
        .gte("occurred_at", windows.rangeStart.toISOString())
        .lte("occurred_at", windows.dayEnd.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(1000),
    ]);

    if (profileError || entriesError) {
      response.status(500).json({
        error: "Unable to load dashboard summary",
        message: profileError?.message ?? entriesError?.message,
      });
      return;
    }

    response.json({
      date: windows.dayStart.toISOString().slice(0, 10),
      windows: {
        day: { from: windows.dayStart.toISOString(), to: windows.dayEnd.toISOString() },
        week: { from: windows.weekStart.toISOString(), to: windows.dayEnd.toISOString() },
        month: { from: windows.monthStart.toISOString(), to: windows.dayEnd.toISOString() },
      },
      summary: buildSummary(entries ?? [], profile, windows),
    });
  } catch (error) {
    next(error);
  }
});
