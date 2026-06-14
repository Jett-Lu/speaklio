import { Router } from "express";
import { z } from "zod";
import { parseLocalCommand } from "../services/localAi.js";

export const assistantRouter = Router();

const parseRequestSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

assistantRouter.post("/parse", async (request, response) => {
  const parsed = parseRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: "Invalid assistant request",
      issues: parsed.error.issues,
    });
    return;
  }

  try {
    const result = await parseLocalCommand(parsed.data.text);
    response.json(result);
  } catch (error) {
    response.status(503).json({
      error: "Local AI unavailable",
      message: error instanceof Error ? error.message : "Unable to parse command",
    });
  }
});
