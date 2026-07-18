import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

export const meRouter = Router();

const personalDataSchema = z.object({
  age: z.number().int().min(13).max(120),
  heightCm: z.number().int().min(100).max(240),
  weightKg: z.number().min(30).max(250),
  activityLevel: z.enum(["light", "moderate", "active", "athlete"]),
});

const goalsSchema = z.object({
  primaryGoal: z.enum(["maintain", "lose", "gain", "performance"]),
  targetWeightKg: z.number().min(30).max(250),
  calorieGoal: z.number().int().min(1000).max(6000),
  proteinGoal: z.number().int().min(20).max(350),
  hydrationGoal: z.number().int().min(1000).max(6000),
  weeklyWorkouts: z.number().int().min(1).max(14),
});

const preferencesSchema = z.object({
  units: z.enum(["Metric", "Imperial"]).optional(),
  notifications: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  assistantInsights: z.boolean().optional(),
  compactCards: z.boolean().optional(),
  monthlyBudget: z.number().min(0).max(100000).optional(),
});

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  personal: personalDataSchema.optional(),
  goals: goalsSchema.optional(),
  preferences: preferencesSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one profile field is required",
});

const profileSelect = "id, display_name, email, avatar_url, timezone, personal_data, goals, preferences, created_at, updated_at";

meRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const authenticatedRequest = request as AuthenticatedRequest;
    const { user } = authenticatedRequest;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
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
      ...(parsed.data.personal !== undefined ? { personal_data: parsed.data.personal } : {}),
      ...(parsed.data.goals !== undefined ? { goals: parsed.data.goals } : {}),
      ...(parsed.data.preferences !== undefined ? { preferences: parsed.data.preferences } : {}),
    };

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select(profileSelect)
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

meRouter.delete("/", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      response.status(500).json({
        error: "Unable to delete account",
        message: error.message,
      });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
