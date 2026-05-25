"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

const AUTH_COOKIE_DOMAIN = ".ekatalox.com";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      appEnv.supabaseUrl,
      appEnv.supabaseAnonKey,
      {
        cookieOptions: {
          domain: AUTH_COOKIE_DOMAIN,
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      },
    );
  }

  return browserClient;
}
