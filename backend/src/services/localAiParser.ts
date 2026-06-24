import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { env } from "../env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const localAiRoot = path.join(repoRoot, "local_ai");

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

const responseFormat = JSON.parse(stripBom(fs.readFileSync(path.join(localAiRoot, "schema.json"), "utf8"))) as unknown;
const scopePrompt = stripBom(fs.readFileSync(path.join(localAiRoot, "docs", "scope.md"), "utf8"));

export const aiActionSchema = z.strictObject({
  type: z.enum([
    "set_profile",
    "set_weight_goal",
    "log_weight",
    "log_workout",
    "log_calories",
    "log_food",
    "request_macro_update",
    "request_tip",
    "ask_dashboard_question",
    "unknown",
  ]),
  date: z.string().nullable().optional(),
  current_weight: z.number().nullable().optional(),
  target_weight: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  weight_unit: z.enum(["kg", "lb"]).nullable().optional(),
  height: z.number().nullable().optional(),
  height_unit: z.enum(["cm", "ft_in"]).nullable().optional(),
  age: z.number().nullable().optional(),
  gender: z.string().nullable().optional(),
  goal_type: z.enum([
    "lose_weight",
    "gain_weight",
    "maintain_weight",
    "build_muscle",
    "improve_fitness",
    "unknown",
  ]).nullable().optional(),
  timeline: z.string().nullable().optional(),
  exercise: z.string().nullable().optional(),
  sets: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  load: z.number().nullable().optional(),
  load_unit: z.enum(["kg", "lb", "bodyweight"]).nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  food: z.string().nullable().optional(),
  quantity: z.string().nullable().optional(),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack", "unknown"]).nullable().optional(),
  calories: z.number().nullable().optional(),
  question: z.string().nullable().optional(),
  confidence: z.number(),
});

const aiParserResponseSchema = z.strictObject({
  actions: z.array(aiActionSchema),
  needs_confirmation: z.boolean(),
  message: z.string().nullable(),
});

export type LocalAiParserResponse = z.infer<typeof aiParserResponseSchema>;
export type LocalAiAction = z.infer<typeof aiActionSchema>;

export async function parseCommandWithLocalAi(text: string): Promise<LocalAiParserResponse> {
  const response = await fetch(`${env.LOCAL_AI_URL}/api/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.LOCAL_AI_MODEL,
      stream: false,
      format: responseFormat,
      messages: [
        {
          role: "system",
          content: scopePrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Local AI request failed with status ${response.status}`);
  }

  const data = await response.json() as { message?: { content?: unknown } };
  const content = data.message?.content;

  if (typeof content !== "string") {
    throw new Error("Local AI response did not include message content");
  }

  const parsed = aiParserResponseSchema.safeParse(JSON.parse(content));

  if (!parsed.success) {
    throw new Error(`Local AI response failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}
