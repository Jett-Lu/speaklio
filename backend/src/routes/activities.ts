import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

export const activitiesRouter = Router();

const activitySelect = "id, user_id, plugin_id, metric_entry_id, title, detail, occurred_at, created_at";

const listQuerySchema = z.object({
  pluginId: z.string().trim().min(1).max(80).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

function toActivityResponse(activity: Record<string, unknown>) {
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

activitiesRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const parsed = listQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid activity filters",
        issues: parsed.error.issues,
      });
      return;
    }

    const { user } = request as AuthenticatedRequest;
    let query = supabaseAdmin
      .from("activities")
      .select(activitySelect, { count: "exact" })
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

    if (parsed.data.pluginId) {
      query = query.eq("plugin_id", parsed.data.pluginId);
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
        error: "Unable to load activities",
        message: error.message,
      });
      return;
    }

    response.json({
      activities: (data ?? []).map(toActivityResponse),
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
