import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

const AUTH_COOKIE_DOMAIN = ".ekatalox.com";

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              domain: AUTH_COOKIE_DOMAIN,
              path: "/",
              sameSite: "lax",
              secure: true,
            });
          });
        } catch {}
      },
    },
  });
}
