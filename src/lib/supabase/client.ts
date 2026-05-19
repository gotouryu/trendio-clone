"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabase } from "../env";

export function createSupabaseBrowser() {
  if (!hasSupabase()) {
    throw new Error(
      "Supabase env vars not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}

export function isSupabaseReady() {
  return hasSupabase();
}
