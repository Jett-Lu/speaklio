import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env.js";

let supabaseAdmin: SupabaseClient | undefined;

export function hasSupabaseConfig() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY);
}

export function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }

  supabaseAdmin ??= createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdmin;
}
