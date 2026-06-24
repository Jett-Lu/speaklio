import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
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
});

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
  limit: z.coerce.number().int().min(1).max(100).default(50),
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
      .select(entrySelect)
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(parsed.data.limit);

    if (parsed.data.pluginId) {
      query = query.eq("plugin_id", parsed.data.pluginId);
    }

    if (parsed.data.entryType) {
      query = query.eq("entry_type", parsed.data.entryType);
    }

    const { data, error } = await query;

    if (error) {
      response.status(500).json({
        error: "Unable to load entries",
        message: error.message,
      });
      return;
    }

    response.json({
      entries: data.map(toEntryResponse),
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

    response.status(201).json({
      entry: toEntryResponse(data),
    });
  } catch (error) {
    next(error);
  }
});

entriesRouter.get("/:id", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .select(entrySelect)
      .eq("id", request.params.id)
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
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .update(toUpdateRow(parsed.data))
      .eq("id", request.params.id)
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
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .delete()
      .eq("id", request.params.id)
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
