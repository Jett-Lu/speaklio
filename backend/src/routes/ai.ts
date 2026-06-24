import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { mapActionsToEntries } from "../services/aiActionMapper.js";
import { createActivityForEntry, toActivityResponse } from "../services/entryActivity.js";
import { aiActionSchema, parseCommandWithLocalAi } from "../services/localAiParser.js";
import { supabaseAdmin } from "../services/supabase.js";

export const aiRouter = Router();

const parseCommandSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

const confirmedEntrySchema = z.object({
  pluginId: z.string().trim().min(1).max(80).nullable().optional(),
  entryType: z.string().trim().min(1).max(80),
  value: z.number().nullable().optional(),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

const previewEntrySchema = z.object({
  text: z.string().trim().min(1).max(1000).optional(),
  actions: z.array(aiActionSchema).optional(),
}).refine((value) => Boolean(value.text) !== Boolean(value.actions), {
  message: "Provide either text or actions",
});

const confirmActionsSchema = z.object({
  entries: z.array(confirmedEntrySchema).min(1).max(20),
});

const entrySelect = "id, user_id, plugin_id, entry_type, value, unit, metadata, occurred_at, created_at";

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

function toCreateRow(userId: string, entry: z.infer<typeof confirmedEntrySchema>) {
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

aiRouter.post("/parse-command", requireAuth, async (request, response) => {
  try {
    const parsed = parseCommandSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid parse command request",
        issues: parsed.error.issues,
      });
      return;
    }

    const result = await parseCommandWithLocalAi(parsed.data.text);

    response.json({
      actions: result.actions,
      needsConfirmation: result.needs_confirmation,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local AI parse failed";
    response.status(503).json({
      error: "Local AI unavailable",
      message,
    });
  }
});

aiRouter.post("/preview-entry", requireAuth, async (request, response) => {
  try {
    const parsed = previewEntrySchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid preview request",
        issues: parsed.error.issues,
      });
      return;
    }

    const parserResult = parsed.data.text
      ? await parseCommandWithLocalAi(parsed.data.text)
      : {
        actions: parsed.data.actions ?? [],
        needs_confirmation: true,
        message: null,
      };

    response.json({
      actions: parserResult.actions,
      previews: mapActionsToEntries(parserResult.actions),
      needsConfirmation: true,
      message: parserResult.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local AI preview failed";
    response.status(503).json({
      error: "Local AI unavailable",
      message,
    });
  }
});

aiRouter.post("/confirm-actions", requireAuth, async (request, response, next) => {
  try {
    const parsed = confirmActionsSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid confirmed entries",
        issues: parsed.error.issues,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    const rows = parsed.data.entries.map((entry) => toCreateRow(user.id, entry));
    const { data, error } = await supabaseAdmin
      .from("metric_entries")
      .insert(rows)
      .select(entrySelect);

    if (error) {
      response.status(500).json({
        error: "Unable to confirm entries",
        message: error.message,
      });
      return;
    }

    const activityResults = await Promise.all((data ?? []).map(createActivityForEntry));
    const activityWarnings = activityResults
      .filter((result) => result.error)
      .map((result) => result.error?.message)
      .filter(Boolean);

    response.status(201).json({
      entries: (data ?? []).map(toEntryResponse),
      activities: activityResults.flatMap((result) => (
        result.data ? [toActivityResponse(result.data)] : []
      )),
      ...(activityWarnings.length > 0 ? { activityWarnings } : {}),
    });
  } catch (error) {
    next(error);
  }
});
