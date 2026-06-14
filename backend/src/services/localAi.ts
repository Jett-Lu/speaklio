import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");

function parseJson<T>(value: string) {
  return JSON.parse(value.replace(/^\uFEFF/, "").trim()) as T;
}

const schema = parseJson<Record<string, unknown>>(
  fs.readFileSync(path.join(repoRoot, "local_ai", "schema.json"), "utf8"),
);
const scope = fs.readFileSync(path.join(repoRoot, "local_ai", "docs", "scope.md"), "utf8");

export async function parseLocalCommand(text: string) {
  const ollamaUrl = env.OLLAMA_URL.replace(/\/$/, "");
  let response: Response;

  try {
    response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.LOCAL_MODEL,
        stream: false,
        format: schema,
        messages: [
          {
            role: "system",
            content: scope,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Could not reach Ollama at ${ollamaUrl}/api/chat: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama request failed with ${response.status}${body ? `: ${body}` : ""}`);
  }

  const data = await response.json() as { message?: { content?: string } };
  if (typeof data.message?.content !== "string") {
    throw new Error("Ollama response did not include message.content");
  }

  return parseJson(data.message.content);
}
