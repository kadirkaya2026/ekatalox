import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

// Yerel geliştirmede (app.localhost) çerez alan adı verilmez; aksi halde tarayıcı
// .ekatalox.com çerezini reddeder ve giriş "Oturum açılamadı" ile düşer.
const AUTH_COOKIE_DOMAIN = process.env.NODE_ENV === "production" ? ".ekatalox.com" : undefined;

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
              secure: process.env.NODE_ENV === "production",
            });
          });
        } catch {}
      },
    },
  });
}
