import { NextResponse } from "next/server";
import {
  getPlanFeatureUpgradeMessage,
  hasPlanFeature,
  type PlanFeature,
  type TenantPlan,
} from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/session";

export async function ensureSuperAdminResponse() {
  const session = await getSessionContext();

  if (!session.profile) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  if (session.profile.role !== "super_admin") {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  return null;
}

export async function ensureTenantAdminResponse() {
  const session = await getSessionContext();

  if (!session.profile) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  if (session.profile.role !== "tenant_admin" && session.supabaseConfigured) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  if (!session.tenant) {
    return NextResponse.json({ error: "Tenant erişimi bulunamadı." }, { status: 403 });
  }

  if (session.tenant.status === "suspended") {
    return NextResponse.json({ error: "Tenant askıya alınmış durumda." }, { status: 403 });
  }

  return null;
}

function resolveTenantPlan(tenant: { plan?: TenantPlan } | null): TenantPlan {
  return tenant?.plan ?? "baslangic";
}

export async function ensureTenantPlanFeatureResponse(feature: PlanFeature) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const plan = resolveTenantPlan(session.tenant);

  if (!hasPlanFeature(plan, feature)) {
    return NextResponse.json(
      { error: getPlanFeatureUpgradeMessage(feature) },
      { status: 403 },
    );
  }

  return null;
}