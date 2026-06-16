import { AdminTenantsManager } from "@/components/admin/admin-tenants-manager";
import { AdminThemeDistributionPanel } from "@/components/admin/admin-theme-distribution-panel";
import { Header } from "@/components/dashboard/header";
import { getTenantsOverview, getThemeDistributionOverview } from "@/lib/data";

export default async function AdminPage() {
  const [tenants, themeDistribution] = await Promise.all([
    getTenantsOverview(),
    getThemeDistributionOverview(),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Merkezi Kontrol"
        title="Tüm tenant’ları tek ekrandan yönetin"
        description="Yeni tenant açın, paket seçin, askıya alın, erişim kodlarını yönetin ve limitleri takip edin."
      />

      <AdminThemeDistributionPanel rows={themeDistribution} />

      <AdminTenantsManager initialTenants={tenants} />
    </div>
  );
}