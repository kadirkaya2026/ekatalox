import {
  buildPlanChangeHref,
  buildVisitorAddonHref,
  getPlanRank,
  isLegacyPlan,
  LEGACY_PLAN_OPTIONS,
  NEW_PLAN_OPTIONS,
  VISITOR_ADDON_PACKAGES,
} from "@/lib/billing/plans";
import type { Tenant } from "@/lib/types";

// Kotanın %80'ine ulaşınca gösterilir; proxy.ts zaten %100'de son
// müşteriye vitrini kapatıyor, bu banner sadece tenant admin'i önceden
// uyarıp üst pakete geçiş / ek kota satın alma yoluna yönlendirir.
const WARNING_THRESHOLD = 0.8;

export function VisitorQuotaBanner({
  tenant,
  used,
  limit,
}: {
  tenant: Tenant;
  used: number;
  limit: number;
}) {
  const ratio = limit > 0 ? used / limit : 0;

  if (ratio < WARNING_THRESHOLD) {
    return null;
  }

  const exceeded = ratio >= 1;
  const track = isLegacyPlan(tenant.plan) ? LEGACY_PLAN_OPTIONS : NEW_PLAN_OPTIONS;
  const nextPlan = track.find((plan) => getPlanRank(plan.id) > getPlanRank(tenant.plan));
  const addonHref = buildVisitorAddonHref(
    tenant.company_name,
    tenant.subdomain,
    VISITOR_ADDON_PACKAGES[0],
  );
  const upgradeHref = nextPlan
    ? buildPlanChangeHref({
        companyName: tenant.company_name,
        subdomain: tenant.subdomain,
        currentPlan: tenant.plan,
        targetPlan: nextPlan.id,
        isTrial: false,
      })
    : null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">
        {exceeded
          ? "🚀 Tebrikler! Mağazana müşteri yağdı!"
          : "🚀 Mağazana müşteri yağıyor!"}
      </p>
      <p className="mt-1 leading-6">
        Aylık {limit.toLocaleString("tr-TR")} olan ziyaretçi kapasiten{" "}
        {exceeded ? "doldu" : `%${Math.round(ratio * 100)}'e ulaştı`}. Potansiyel
        müşterilerini kaçırmamak ve mağazanı kesintisiz açık tutmak için tek
        tıkla bir üst pakete geçebilir ya da ek ziyaretçi kapasitesi satın
        alabilirsin.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={addonHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
        >
          📦 Paketime +{VISITOR_ADDON_PACKAGES[0].visitors.toLocaleString("tr-TR")} Ziyaretçi Ekle
        </a>
        {upgradeHref ? (
          <a
            href={upgradeHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Üst Pakete Geç
          </a>
        ) : null}
      </div>
    </div>
  );
}
