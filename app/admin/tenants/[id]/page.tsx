import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminTenantDetailPanel } from "@/components/admin/admin-tenant-detail-panel";
import { CustomersManager } from "@/components/dashboard/customers-manager";
import { Header } from "@/components/dashboard/header";
import { OnlinePresenceCard } from "@/components/dashboard/online-presence-card";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { Button } from "@/components/ui/button";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { getTenantCustomersOverview } from "@/lib/customers/data";
import { getTenantPanelVisits, getTenantsOverview } from "@/lib/data";
import { AdminPanelVisitsCard } from "@/components/admin/admin-panel-visits-card";

export default async function AdminTenantDetailPage({
  params,
}: PageProps<"/admin/tenants/[id]">) {
  const { id } = await params;
  const tenants = await getTenantsOverview();
  const tenant = tenants.find((entry) => entry.id === id);

  if (!tenant) {
    notFound();
  }

  const loadedAt = new Date().toISOString();
  const [report, presence, customers, panelVisits] = await Promise.all([
    getTenantAnalyticsReport(tenant.id, "daily"),
    getTenantOnlinePresence(tenant.id),
    tenant.business_type === "market" ? getTenantCustomersOverview(tenant.id) : Promise.resolve([]),
    getTenantPanelVisits(tenant.id, 30),
  ]);

  // Sunucuda hazırlanan bölümler sekmelere yerleşir (14 Eki 2026 düzeni):
  // özet kartı + sekmeler; raporlar ve müşteriler alt alta yığılmaz.
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Tenant Detayı"
        title={tenant.company_name}
        description="Paket, üyelik, erişim şifreleri, panel ziyaretleri ve raporlar tek sayfada."
        action={
          <Button asChild variant="secondary" href="/admin" className="h-10 px-4 py-0 text-sm">
            <ArrowLeft className="size-4" />
            Tenant listesi
          </Button>
        }
      />

      <AdminTenantDetailPanel
        tenant={tenant}
        slots={{
          visits: <AdminPanelVisitsCard visits={panelVisits} loadedAt={loadedAt} />,
          reports: (
            <div className="space-y-4">
              <OnlinePresenceCard initialPresence={presence} endpoint={`/api/admin/tenants/${tenant.id}/presence`} />
              <ReportsPanel initialReport={report} endpoint={`/api/admin/tenants/${tenant.id}/reports`} />
            </div>
          ),
          customers:
            tenant.business_type === "market" ? (
              <CustomersManager initialCustomers={customers} ordersEndpointBase={`/api/admin/tenants/${tenant.id}/customers`} />
            ) : undefined,
        }}
      />
    </div>
  );
}
