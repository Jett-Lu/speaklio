import { Router } from "express";
import { supabaseAdmin } from "../services/supabase.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    status: "ok",
    service: "speaklio-api",
  });
});

healthRouter.get("/supabase", async (_request, response, next) => {
  try {
    const { count, error } = await supabaseAdmin
      .from("plugins")
      .select("id", { count: "exact", head: true });

    if (error) {
      response.status(503).json({
        status: "error",
        service: "supabase",
        message: error.message,
      });
      return;
    }

    response.json({
      status: "ok",
      service: "supabase",
      pluginCount: count,
    });
  } catch (error) {
    next(error);
  }
});
