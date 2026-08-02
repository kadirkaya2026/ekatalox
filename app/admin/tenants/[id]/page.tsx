import { notFound } from "next/navigation";
import { AdminTenantDetailPanel } from "@/components/admin/admin-tenant-detail-panel";
import { Header } from "@/components/dashboard/header";
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

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Tenant Detayı"
        title={tenant.company_name}
        description="Paket, kapasite, üyelik ve erişim şifrelerini bu sayfadan yönetin."
      />

      <AdminTenantDetailPanel tenant={tenant} />
    </div>
  );
}
