import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasPlanFeature } from "@/lib/billing/plans";

export default async function ReportsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const canUseReports = hasPlanFeature(tenant.plan, "reports");
  const report = canUseReports
    ? await getTenantAnalyticsReport(tenant.id, "daily")
    : null;

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
        {report ? <ReportsPanel initialReport={report} /> : null}
      </PlanFeatureGate>
    </div>
  );
}
