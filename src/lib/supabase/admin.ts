import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/types";

/**
 * Service-role client — BYPASSES Row Level Security.
 * Use ONLY in trusted server code (payment verification, webhooks).
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
