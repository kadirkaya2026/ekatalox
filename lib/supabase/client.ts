"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

// Yerel geliştirmede (app.localhost) çerez alan adı verilmez; aksi halde tarayıcı
// .ekatalox.com çerezini reddeder ve giriş "Oturum açılamadı" ile düşer.
const AUTH_COOKIE_DOMAIN = process.env.NODE_ENV === "production" ? ".ekatalox.com" : undefined;

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
          secure: process.env.NODE_ENV === "production",
        },
      },
    );
  }

  return browserClient;
}
