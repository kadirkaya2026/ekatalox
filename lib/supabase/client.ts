"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

/** `.ekatalox.com` in production, undefined on localhost */
function cookieDomain(): string | undefined {
  const root = appEnv.rootDomain;
  return root === "localhost" ? undefined : `.${root}`;
}

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (!browserClient) {
    const domain = cookieDomain();
    browserClient = createBrowserClient(
      appEnv.supabaseUrl,
      appEnv.supabaseAnonKey,
      {
        cookieOptions: {
          ...(domain ? { domain } : {}),
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      },
    );
  }

  return browserClient;
}
