import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { parseCommandWithLocalAi } from "../services/localAiParser.js";

export const aiRouter = Router();

const parseCommandSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

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
