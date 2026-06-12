import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

export const meRouter = Router();

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one profile field is required",
});

meRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const authenticatedRequest = request as AuthenticatedRequest;
    const { user } = authenticatedRequest;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email, avatar_url, timezone, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      response.status(500).json({
        error: "Unable to load profile",
        message: error.message,
      });
      return;
    }

    response.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
});

meRouter.patch("/profile", requireAuth, async (request, response, next) => {
  try {
    const parsed = profileUpdateSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid profile update",
        issues: parsed.error.issues,
      });
      return;
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    const { user } = authenticatedRequest;
    const updates = {
      ...(parsed.data.displayName !== undefined ? { display_name: parsed.data.displayName } : {}),
      ...(parsed.data.timezone !== undefined ? { timezone: parsed.data.timezone } : {}),
      ...(parsed.data.avatarUrl !== undefined ? { avatar_url: parsed.data.avatarUrl } : {}),
    };

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, display_name, email, avatar_url, timezone, created_at, updated_at")
      .single();

    if (error) {
      response.status(500).json({
        error: "Unable to update profile",
        message: error.message,
      });
      return;
    }

    response.json({
      profile,
    });
  } catch (error) {
    next(error);
  }
});
