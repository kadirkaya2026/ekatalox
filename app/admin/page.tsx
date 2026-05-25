import { AdminTenantsManager } from "@/components/admin/admin-tenants-manager";
import { Header } from "@/components/dashboard/header";
import { getTenantsOverview } from "@/lib/data";

export default async function AdminPage() {
  const tenants = await getTenantsOverview();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Merkezi Kontrol"
        title="Tüm tenant’ları tek ekrandan yönetin"
        description="Yeni tenant açın, askıya alın, erişim kodlarını yönetin ve paket limitlerini takip edin."
      />

      <AdminTenantsManager initialTenants={tenants} />
    </div>
  );
}