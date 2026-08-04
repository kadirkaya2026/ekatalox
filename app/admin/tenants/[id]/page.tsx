import { notFound } from "next/navigation";
import { AdminTenantDetailPanel } from "@/components/admin/admin-tenant-detail-panel";
import { Header } from "@/components/dashboard/header";
import { OnlinePresenceCard } from "@/components/dashboard/online-presence-card";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { getTenantsOverview } from "@/lib/data";

export default async function AdminTenantDetailPage({
  params,
}: PageProps<"/admin/tenants/[id]">) {
  const { id } = await params;
  const tenants = await getTenantsOverview();
  const tenant = tenants.find((entry) => entry.id === id);

  if (!tenant) {
    notFound();
  }

  const [report, presence] = await Promise.all([
    getTenantAnalyticsReport(tenant.id, "daily"),
    getTenantOnlinePresence(tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Tenant Detayı"
        title={tenant.company_name}
        description="Paket, kapasite, üyelik ve erişim şifrelerini bu sayfadan yönetin."
      />

      <AdminTenantDetailPanel tenant={tenant} />

      <Header
        eyebrow="Raporlar"
        title="Mağaza Raporları"
        description="Bu müşterinin ziyaretçi, sipariş PDF, arama ve trafik verilerini paketinden bağımsız olarak görüntüleyin."
      />

      <OnlinePresenceCard
        initialPresence={presence}
        endpoint={`/api/admin/tenants/${tenant.id}/presence`}
      />
      <ReportsPanel
        initialReport={report}
        endpoint={`/api/admin/tenants/${tenant.id}/reports`}
      />
    </div>
  );
}
