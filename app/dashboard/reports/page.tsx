import { Header } from "@/components/dashboard/header";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function ReportsPage() {
  const session = await requireTenantAdminPage();
  const report = await getTenantAnalyticsReport(session.tenant!.id, "daily");

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Mağaza Raporları"
        description="Vitrin ziyaretçileri, en çok tıklanan ürünler ve sepete eklenen ürünleri günlük, haftalık veya aylık görüntüleyin."
      />

      <ReportsPanel initialReport={report} />
    </div>
  );
}
