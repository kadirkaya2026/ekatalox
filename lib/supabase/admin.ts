import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasServiceRoleEnv, requireServiceRoleEnv } from "@/lib/env";

export function createSupabaseAdminClient(): SupabaseClient | null {
  if (!hasServiceRoleEnv()) {
    return null;
  }

  const { serviceRoleKey, url } = requireServiceRoleEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}