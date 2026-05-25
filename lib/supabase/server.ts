import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appEnv, hasSupabaseEnv } from "@/lib/env";

/** `.ekatalox.com` in production, undefined on localhost */
function cookieDomain(): string | undefined {
  const root = appEnv.rootDomain;
  return root === "localhost" ? undefined : `.${root}`;
}

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const cookieStore = await cookies();
  const domain = cookieDomain();

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
              ...(domain ? { domain } : {}),
            });
          });
        } catch {}
      },
    },
  });
}
