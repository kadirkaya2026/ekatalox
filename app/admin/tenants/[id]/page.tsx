import { notFound } from "next/navigation";
import { AdminTenantDetailPanel } from "@/components/admin/admin-tenant-detail-panel";
import { CustomersManager } from "@/components/dashboard/customers-manager";
import { Header } from "@/components/dashboard/header";
import { OnlinePresenceCard } from "@/components/dashboard/online-presence-card";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { getTenantCustomersOverview } from "@/lib/customers/data";
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

  const [report, presence, customers] = await Promise.all([
    getTenantAnalyticsReport(tenant.id, "daily"),
    getTenantOnlinePresence(tenant.id),
    tenant.business_type === "market" ? getTenantCustomersOverview(tenant.id) : Promise.resolve([]),
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

      {tenant.business_type === "market" ? (
        <>
          <Header
            eyebrow="Raporlar"
            title="Müşteriler"
            description="Bu market'in müşteri isim, adres, telefon ve sipariş geçmişi verileri."
          />
          <CustomersManager
            initialCustomers={customers}
            ordersEndpointBase={`/api/admin/tenants/${tenant.id}/customers`}
          />
        </>
      ) : null}
    </div>
  );
}
