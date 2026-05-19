import { createClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "../env";

/**
 * Admin client uses SERVICE_ROLE_KEY and bypasses RLS.
 * Use ONLY in API Routes after verifying the caller is an admin.
 * Never expose this to the client.
 */
export function createSupabaseAdmin() {
  if (!hasSupabase() || !env.supabaseServiceRole) {
    throw new Error("Supabase service role key not configured");
  }
  return createClient(env.supabaseUrl!, env.supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
