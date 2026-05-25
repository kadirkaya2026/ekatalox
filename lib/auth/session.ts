import { redirect } from "next/navigation";
import { demoMemberships, demoProfiles, demoTenants } from "@/lib/demo-data";
import { appEnv, shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, Tenant } from "@/lib/types";

export interface SessionContext {
  userId: string | null;
  profile: Profile | null;
  tenant: Tenant | null;
  supabaseConfigured: boolean;
}

export async function getSessionContext(): Promise<SessionContext> {
  // Step 1: verify the JWT cookie with the user-scoped client
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return {
        userId: null,
        profile: null,
        tenant: null,
        supabaseConfigured: false,
      };
    }

    return {
      userId: "demo-super-admin",
      profile: demoProfiles[0] ?? null,
      tenant: demoTenants[0] ?? null,
      supabaseConfigured: false,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      profile: null,
      tenant: null,
      supabaseConfigured: true,
    };
  }

  // Step 2: read profiles / memberships with the admin client so RLS never
  // blocks a legitimate server-side lookup.
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      userId: user.id,
      profile: null,
      tenant: null,
      supabaseConfigured: true,
    };
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileRow as Profile | null) ?? null;

  let tenant: Tenant | null = null;

  if (profile?.role === "tenant_admin") {
    const { data: membershipRow } = await admin
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const membership = (membershipRow as { tenant_id: string } | null) ?? null;

    if (membership?.tenant_id) {
      const { data: tenantData } = await admin
        .from("tenants")
        .select("*")
        .eq("id", membership.tenant_id)
        .maybeSingle();

      tenant = (tenantData as Tenant | null) ?? null;
    }
  }

  return {
    userId: user.id,
    profile: profile ?? null,
    tenant,
    supabaseConfigured: true,
  };
}

export function absoluteUrl(host: string, path = "/") {
  return `https://${host}${path}`;
}

export async function requireSuperAdminPage() {
  const session = await getSessionContext();

  if (!session.profile) {
    redirect(absoluteUrl(appEnv.marketingDomain, "/login?next=admin"));
  }

  if (session.profile.role !== "super_admin") {
    redirect(absoluteUrl(appEnv.appDomain, "/"));
  }

  return session;
}

export async function requireTenantAdminPage() {
  const session = await getSessionContext();

  if (!session.supabaseConfigured && shouldAllowDemoFallback()) {
    const membership = demoMemberships[0];
    const tenant = demoTenants.find((item) => item.id === membership?.tenant_id) ?? null;

    return {
      ...session,
      userId: membership?.user_id ?? "demo-tenant-admin",
      tenant,
      profile: {
        id: membership?.user_id ?? "demo-tenant-admin",
        full_name: "Demo Tenant Admin",
        role: "tenant_admin",
        created_at: new Date().toISOString(),
      },
    };
  }

  if (!session.supabaseConfigured) {
    redirect(absoluteUrl(appEnv.marketingDomain, "/login?next=app"));
  }

  if (!session.profile) {
    redirect(absoluteUrl(appEnv.marketingDomain, "/login?next=app"));
  }

  if (session.profile.role !== "tenant_admin" && session.supabaseConfigured) {
    redirect(absoluteUrl(appEnv.adminDomain, "/"));
  }

  if (!session.tenant && session.supabaseConfigured) {
    redirect(absoluteUrl(appEnv.marketingDomain, "/login?next=app"));
  }

  return session;
}

export function getPostLoginRedirectPath(role: string | undefined | null) {
  if (role === "super_admin") {
    return absoluteUrl(appEnv.adminDomain);
  }

  return absoluteUrl(appEnv.appDomain);
}
