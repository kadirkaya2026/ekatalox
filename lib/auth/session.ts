import { cache } from "react";
import { redirect } from "next/navigation";
import { demoMemberships, demoProfiles, demoTenants } from "@/lib/demo-data";
import {
  hasPlanFeature,
  type PlanFeature,
  type TenantPlan,
} from "@/lib/billing/plans";
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

// Wrapped in React cache() so a single request (e.g. layout + page rendering
// on the same navigation) reuses one result instead of re-running the auth
// round-trip and three DB queries per caller.
export const getSessionContext = cache(async (): Promise<SessionContext> => {
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

  // Fetch the profile and the membership (with its tenant embedded via the
  // tenant_memberships → tenants FK) in parallel, so the session lookup costs
  // one round trip instead of three sequential ones.
  const [profileResult, membershipResult] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("tenant_memberships")
      .select("tenant_id, tenants(*)")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = (profileResult.data as Profile | null) ?? null;

  let tenant: Tenant | null = null;

  if (profile?.role === "tenant_admin" && membershipResult.data) {
    const embeddedTenant = (
      membershipResult.data as { tenants: Tenant | Tenant[] | null }
    ).tenants;

    tenant = Array.isArray(embeddedTenant)
      ? embeddedTenant[0] ?? null
      : embeddedTenant ?? null;
  }

  return {
    userId: user.id,
    profile,
    tenant,
    supabaseConfigured: true,
  };
});

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
        role: "tenant_admin" as const,
        must_change_password: false,
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

export async function requireTenantPlanFeaturePage(feature: PlanFeature) {
  const session = await requireTenantAdminPage();
  const plan: TenantPlan = session.tenant?.plan ?? "baslangic";

  if (!hasPlanFeature(plan, feature)) {
    redirect(absoluteUrl(appEnv.appDomain, "/dashboard"));
  }

  return session;
}

export function getPostLoginRedirectPath(role: string | undefined | null) {
  if (role === "super_admin") {
    return absoluteUrl(appEnv.adminDomain);
  }

  return absoluteUrl(appEnv.appDomain);
}
