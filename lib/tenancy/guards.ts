import { NextResponse } from "next/server";
import {
  getPlanFeatureUpgradeMessage,
  getPlanLabel,
  getPriceListLimit,
  hasPlanFeature,
  type PlanFeature,
  type TenantPlan,
} from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export const DEMO_TENANT_WRITE_BLOCKED_MESSAGE =
  "Bu bir demo gösterim hesabıdır, bu hesapta değişiklik kaydedilemez. Tüm özellikleri test etmek için ücretsiz deneme hesabı oluşturabilirsiniz.";

export async function ensureTenantAdminResponse(
  options?: { blockDemoWrite?: boolean },
) {
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

  if (options?.blockDemoWrite && session.tenant.is_demo) {
    return NextResponse.json(
      { error: DEMO_TENANT_WRITE_BLOCKED_MESSAGE },
      { status: 403 },
    );
  }

  return null;
}

function resolveTenantPlan(tenant: { plan?: TenantPlan } | null): TenantPlan {
  return tenant?.plan ?? "baslangic";
}

// Paket bazlı fiyat seviyesi vaadi (bkz. app/page.tsx Pricing bölümü: "3/5/10/20
// Seviyeli Müşteri Fiyat Listesi") pratikte erişim şifresi (access_code) sayısı
// üzerinden uygulanır — tenant admin her şifreyi bir fiyat listesine bağlayarak
// müşteri fiyat seviyesi oluşturur. Fiyatsız katalog (is_catalog_only) şifreleri
// bir "fiyat seviyesi" göstermediği için bu sayıma dahil edilmez; aksi halde
// varsayılan fiyatsız katalog şifresi tek başına bir kotayı tüketip tenant'ın
// vaat edilenden bir eksik fiyatlı seviye eklemesine yol açar.
export async function ensureAccessCodeLimitResponse() {
  const session = await getSessionContext();
  const plan = resolveTenantPlan(session.tenant);
  const limit = getPriceListLimit(plan);

  if (limit === null) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase || !session.tenant) {
    return null;
  }

  const { count } = await supabase
    .from("access_codes")
    .select("id, price_lists!inner(is_catalog_only)", { count: "exact", head: true })
    .eq("tenant_id", session.tenant.id)
    .eq("price_lists.is_catalog_only", false);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      {
        error: `${getPlanLabel(plan)} paketinde en fazla ${limit} fiyat seviyesi (şifre) oluşturabilirsiniz. Daha fazlası için paketinizi yükseltin.`,
      },
      { status: 403 },
    );
  }

  return null;
}

export async function ensureTenantPlanFeatureResponse(
  feature: PlanFeature,
  options?: { blockDemoWrite?: boolean },
) {
  const guard = await ensureTenantAdminResponse(options);
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