import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

export const meRouter = Router();

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
