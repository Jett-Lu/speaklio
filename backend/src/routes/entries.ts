import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createActivityForEntry, toActivityResponse } from "../services/entryActivity.js";
import { supabaseAdmin } from "../services/supabase.js";

export const entriesRouter = Router();

const entrySelect = "id, user_id, plugin_id, entry_type, value, unit, metadata, occurred_at, created_at";

const createEntrySchema = z.object({
  pluginId: z.string().trim().min(1).max(80).nullable().optional(),
  entryType: z.string().trim().min(1).max(80),
  value: z.number().nullable().optional(),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime({ offset: true }).optional(),
}).superRefine(validateEntryByType);

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

function hasMetadataString(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "string" && metadata[key].trim().length > 0;
}

function hasMetadataBoolean(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "boolean";
}

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateEntryByType(
  entry: z.infer<typeof createEntrySchema>,
  context: z.RefinementCtx,
) {
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

  if (entry.entryType === "log_food" && !hasMetadataString(entry.metadata, "food")) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "food"],
      message: "Food logs require metadata.food",
    });
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
