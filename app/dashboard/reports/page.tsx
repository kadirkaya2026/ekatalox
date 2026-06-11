import { Header } from "@/components/dashboard/header";
import { OnlinePresenceCard } from "@/components/dashboard/online-presence-card";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasPlanFeature } from "@/lib/billing/plans";

export default async function ReportsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const canUseReports = hasPlanFeature(tenant.plan, "reports");
  const [report, presence] = canUseReports
    ? await Promise.all([
        getTenantAnalyticsReport(tenant.id, "daily"),
        getTenantOnlinePresence(tenant.id),
      ])
    : [null, null];

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Mağaza Raporları"
        description="Ziyaretçi, sipariş PDF, arama, fiyat listesi girişleri ve trafik dağılımını günlük, haftalık veya aylık döneme göre görüntüleyin."
      />

      <PlanFeatureGate
        feature="reports"
        plan={tenant.plan}
        companyName={tenant.company_name}
      >
        {presence ? <OnlinePresenceCard initialPresence={presence} /> : null}
        {report ? <ReportsPanel initialReport={report} /> : null}
      </PlanFeatureGate>
    </div>
  );
}
