import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { mapActionsToEntries } from "../services/aiActionMapper.js";
import { createEntrySchema } from "../services/entryContracts.js";
import { createActivityForEntry, toActivityResponse } from "../services/entryActivity.js";
import { aiActionSchema, parseCommandWithLocalAi } from "../services/localAiParser.js";
import { supabaseAdmin } from "../services/supabase.js";

export const aiRouter = Router();

const parseCommandSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

const confirmedEntrySchema = createEntrySchema;

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

const mealHints = [
  { pattern: /\bbreakfast\b/i, meal: "breakfast" },
  { pattern: /\blunch\b/i, meal: "lunch" },
  { pattern: /\bdinner\b/i, meal: "dinner" },
  { pattern: /\bsnack\b/i, meal: "snack" },
] as const;

const commonFoodEstimates = [
  {
    pattern: /\bchocolate chip cookies?\b/i,
    food: "chocolate chip cookie",
    calories: 170,
    protein: 2,
    carbs: 24,
    fats: 8,
    fiber: 1,
  },
  {
    pattern: /\bcookies?\b/i,
    food: "cookie",
    calories: 160,
    protein: 2,
    carbs: 22,
    fats: 7,
    fiber: 1,
  },
  {
    pattern: /\bice cream\b/i,
    food: "ice cream",
    calories: 150,
    protein: 3,
    carbs: 18,
    fats: 8,
    fiber: 0,
  },
  {
    pattern: /\bbananas?\b/i,
    food: "banana",
    calories: 105,
    protein: 1,
    carbs: 27,
    fats: 0,
    fiber: 3,
  },
  {
    pattern: /\bapples?\b/i,
    food: "apple",
    calories: 95,
    protein: 1,
    carbs: 25,
    fats: 0,
    fiber: 4,
  },
  {
    pattern: /\beggs?\b/i,
    food: "egg",
    calories: 70,
    protein: 6,
    carbs: 1,
    fats: 5,
    fiber: 0,
  },
] as const;

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

function inferredMeal(text: string) {
  return mealHints.find((hint) => hint.pattern.test(text))?.meal ?? "snack";
}

function stripFoodTail(value: string) {
  return value
    .replace(/\b(today|tonight|this morning|this afternoon|this evening|yesterday)\b.*$/i, "")
    .replace(/\b(for|as)\s+(breakfast|lunch|dinner|a snack|snack)\b.*$/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
}

function foodNameFromNaturalText(text: string) {
  const match = text.match(/\b(?:i\s+(?:have|had|ate|eat|am having|was having)|(?:log|add|track|record)\s+(?:that\s+)?(?:i\s+)?(?:had|ate)?)\s+(?:a|an|some|the)?\s+(.+)/i);
  if (!match) return null;
  const food = stripFoodTail(match[1]);
  if (!food || /\b(water|sleep|slept|spent|paid|bought|workout|exercise|training|meditat|mindful)\b/i.test(food)) {
    return null;
  }
  return food;
}

function fallbackFoodActionFromText(text: string) {
  const food = foodNameFromNaturalText(text);
  if (!food) return null;

  const estimate = commonFoodEstimates.find((item) => item.pattern.test(food));
  if (!estimate) return null;

  return {
    type: "log_food",
    food: estimate.food,
    quantity: "estimated single serving",
    meal: inferredMeal(text),
    calories: estimate.calories,
    protein: estimate.protein,
    carbs: estimate.carbs,
    fats: estimate.fats,
    fiber: estimate.fiber,
    nutrition_estimated: true,
    confidence: 0.65,
  } satisfies z.infer<typeof aiActionSchema>;
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

    const parserPreviews = mapActionsToEntries(parserResult.actions);
    const fallbackFoodAction = parsed.data.text && parserPreviews.every((preview) => !preview.entry)
      ? fallbackFoodActionFromText(parsed.data.text)
      : null;
    const actions = fallbackFoodAction ? [fallbackFoodAction] : parserResult.actions;
    const previews = fallbackFoodAction ? mapActionsToEntries(actions) : parserPreviews;

    response.json({
      actions,
      previews,
      needsConfirmation: true,
      message: fallbackFoodAction
        ? "I estimated nutrition for a common serving. Review before saving."
        : parserResult.message,
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
