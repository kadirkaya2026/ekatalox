"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      appEnv.supabaseUrl,
      appEnv.supabaseAnonKey,
    );
  }

  return browserClient;
}