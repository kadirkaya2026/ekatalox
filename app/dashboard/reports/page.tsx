import { Header } from "@/components/dashboard/header";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { requireTenantPlanFeaturePage } from "@/lib/auth/session";

export default async function ReportsPage() {
  const session = await requireTenantPlanFeaturePage("reports");
  const report = await getTenantAnalyticsReport(session.tenant!.id, "daily");

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Mağaza Raporları"
        description="Tekil ziyaretçi, en çok tıklanan ve sepete eklenen ürünleri günlük, haftalık veya aylık döneme göre görüntüleyin."
      />

      <ReportsPanel initialReport={report} />
    </div>
  );
}
