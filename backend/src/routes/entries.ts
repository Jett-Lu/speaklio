import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createEntrySchema } from "../services/entryContracts.js";
import { createActivityForEntry, toActivityResponse } from "../services/entryActivity.js";
import { supabaseAdmin } from "../services/supabase.js";

export const entriesRouter = Router();

const entrySelect = "id, user_id, plugin_id, entry_type, value, unit, metadata, occurred_at, created_at";

const updateEntrySchema = z.object({
  pluginId: z.string().trim().min(1).max(80).nullable().optional(),
  entryType: z.string().trim().min(1).max(80).optional(),
  value: z.number().nullable().optional(),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one entry field is required",
});

const listQuerySchema = z.object({
  pluginId: z.string().trim().min(1).max(80).optional(),
  entryType: z.string().trim().min(1).max(80).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const summaryQuerySchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
}).refine((value) => new Date(value.from) <= new Date(value.to), {
  message: "from must be before to",
  path: ["from"],
});

function toEntryResponse(entry: Record<string, unknown>) {
  return {
    id: entry.id,
    userId: entry.user_id,
    pluginId: entry.plugin_id,
    entryType: entry.entry_type,
    value: entry.value,
    unit: entry.unit,
    metadata: entry.metadata,
    occurredAt: entry.occurred_at,
    createdAt: entry.created_at,
  };
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

function hydrationMl(entry: Record<string, unknown>) {
  const amount = numberValue(entry.value);
  const unit = String(entry.unit ?? "ml").toLowerCase();
  if (unit === "l") return amount * 1000;
  if (unit === "oz") return amount * 29.5735;
  return amount;
}

function addRollup(
  rollups: Record<string, { count: number; valueTotal: number }>,
  key: string,
  value: unknown,
) {
  rollups[key] = rollups[key] ?? { count: 0, valueTotal: 0 };
  rollups[key].count += 1;
  rollups[key].valueTotal += numberValue(value);
}

function buildEntriesSummary(entries: Record<string, unknown>[]) {
  const summary = {
    totals: {
      entries: entries.length,
      value: 0,
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
      },
      finance: {
        spending: 0,
      },
      hydration: {
        ml: 0,
      },
      sleep: {
        minutes: 0,
      },
      mindfulness: {
        minutes: 0,
        count: 0,
      },
      workouts: {
        planned: 0,
        completed: 0,
      },
    },
    byPlugin: {} as Record<string, { count: number; valueTotal: number }>,
    byEntryType: {} as Record<string, { count: number; valueTotal: number }>,
  };

  entries.forEach((entry) => {
    const metadata = metadataOf(entry);
    const pluginId = String(entry.plugin_id ?? "uncategorized");
    const entryType = String(entry.entry_type ?? "unknown");
    const value = numberValue(entry.value);

    summary.totals.value += value;
    addRollup(summary.byPlugin, pluginId, entry.value);
    addRollup(summary.byEntryType, entryType, entry.value);

    if (entryType === "log_food") {
      summary.totals.nutrition.calories += numberValue(metadata.calories ?? entry.value);
      summary.totals.nutrition.protein += numberValue(metadata.protein);
      summary.totals.nutrition.carbs += numberValue(metadata.carbs);
      summary.totals.nutrition.fats += numberValue(metadata.fats);
      summary.totals.nutrition.fiber += numberValue(metadata.fiber);
    }

    if (entryType === "log_calories") {
      summary.totals.nutrition.calories += value;
    }

    if (entryType === "log_expense") {
      summary.totals.finance.spending += value;
    }

    if (entryType === "log_hydration") {
      summary.totals.hydration.ml += hydrationMl(entry);
    }

    if (entryType === "log_sleep") {
      summary.totals.sleep.minutes += value;
    }

    if (entryType === "log_mindfulness") {
      summary.totals.mindfulness.minutes += value;
      summary.totals.mindfulness.count += 1;
    }

    if (entryType === "log_workout") {
      if (metadata.completed === true) {
        summary.totals.workouts.completed += 1;
      } else {
        summary.totals.workouts.planned += 1;
      }
    }
  });

  return summary;
}

function toCreateRow(userId: string, entry: z.infer<typeof createEntrySchema>) {
  return {
    user_id: userId,
    plugin_id: entry.pluginId ?? null,
    entry_type: entry.entryType,
    value: entry.value ?? null,
    unit: entry.unit ?? null,
    metadata: entry.metadata,
    ...(entry.occurredAt ? { occurred_at: entry.occurredAt } : {}),
  };
}

function toUpdateRow(entry: z.infer<typeof updateEntrySchema>) {
  return {
    ...(entry.pluginId !== undefined ? { plugin_id: entry.pluginId } : {}),
    ...(entry.entryType !== undefined ? { entry_type: entry.entryType } : {}),
    ...(entry.value !== undefined ? { value: entry.value } : {}),
    ...(entry.unit !== undefined ? { unit: entry.unit } : {}),
    ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
    ...(entry.occurredAt !== undefined ? { occurred_at: entry.occurredAt } : {}),
  };
}

entriesRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const parsed = listQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid entry filters",
        issues: parsed.error.issues,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    let query = supabaseAdmin
      .from("metric_entries")
      .select(entrySelect, { count: "exact" })
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

    if (parsed.data.pluginId) {
      query = query.eq("plugin_id", parsed.data.pluginId);
    }

    if (parsed.data.entryType) {
      query = query.eq("entry_type", parsed.data.entryType);
    }

    if (parsed.data.from) {
      query = query.gte("occurred_at", parsed.data.from);
    }

    if (parsed.data.to) {
      query = query.lte("occurred_at", parsed.data.to);
    }

    const { data, error, count } = await query;

    if (error) {
      response.status(500).json({
        error: "Unable to load entries",
        message: error.message,
      });
      return;
    }

    response.json({
      entries: data.map(toEntryResponse),
      pagination: {
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        count,
      },
    });
  } catch (error) {
    next(error);
  }
});

entriesRouter.get("/summary", requireAuth, async (request, response, next) => {
  try {
    const parsed = summaryQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid entry summary filters",
        issues: parsed.error.issues,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .select(entrySelect)
      .eq("user_id", user.id)
      .gte("occurred_at", parsed.data.from)
      .lte("occurred_at", parsed.data.to)
      .order("occurred_at", { ascending: false })
      .limit(5000);

    if (error) {
      response.status(500).json({
        error: "Unable to load entry summary",
        message: error.message,
      });
      return;
    }

    response.json({
      window: {
        from: parsed.data.from,
        to: parsed.data.to,
      },
      ...buildEntriesSummary(data ?? []),
    });
  } catch (error) {
    next(error);
  }
});

entriesRouter.post("/", requireAuth, async (request, response, next) => {
  try {
    const parsed = createEntrySchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid entry",
        issues: parsed.error.issues,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .insert(toCreateRow(user.id, parsed.data))
      .select(entrySelect)
      .single();

    if (error) {
      response.status(500).json({
        error: "Unable to create entry",
        message: error.message,
      });
      return;
    }

    const { data: activity, error: activityError } = await createActivityForEntry(data);

    response.status(201).json({
      entry: toEntryResponse(data),
      activity: activity ? toActivityResponse(activity) : null,
      ...(activityError ? { activityWarning: activityError.message } : {}),
    });
  } catch (error) {
    next(error);
  }
});

entriesRouter.get("/:id", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const entryId = String(request.params.id);
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .select(entrySelect)
      .eq("id", entryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      response.status(500).json({
        error: "Unable to load entry",
        message: error.message,
      });
      return;
    }

    if (!data) {
      response.status(404).json({
        error: "Entry not found",
      });
      return;
    }

    response.json({
      entry: toEntryResponse(data),
    });
  } catch (error) {
    next(error);
  }
});

entriesRouter.patch("/:id", requireAuth, async (request, response, next) => {
  try {
    const parsed = updateEntrySchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid entry update",
        issues: parsed.error.issues,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const entryId = String(request.params.id);
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .update(toUpdateRow(parsed.data))
      .eq("id", entryId)
      .eq("user_id", user.id)
      .select(entrySelect)
      .maybeSingle();

    if (error) {
      response.status(500).json({
        error: "Unable to update entry",
        message: error.message,
      });
      return;
    }

    if (!data) {
      response.status(404).json({
        error: "Entry not found",
      });
      return;
    }

    response.json({
      entry: toEntryResponse(data),
    });
  } catch (error) {
    next(error);
  }
});

entriesRouter.delete("/:id", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const entryId = String(request.params.id);
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      response.status(500).json({
        error: "Unable to delete entry",
        message: error.message,
      });
      return;
    }

    if (!data) {
      response.status(404).json({
        error: "Entry not found",
      });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
