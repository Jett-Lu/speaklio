import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(backendRoot, ".env"), override: true, quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:4173"),
  OLLAMA_URL: z.string().url().default("http://localhost:11434"),
  LOCAL_MODEL: z.string().min(1).default("speaklio-parser"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
