import { AdminTenantsManager } from "@/components/admin/admin-tenants-manager";
import { Header } from "@/components/dashboard/header";
import { getTenantsOverview } from "@/lib/data";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { sekme } = await searchParams;
  const tenants = await getTenantsOverview();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Merkezi Kontrol"
        title="Tüm tenant’ları tek ekrandan yönetin"
        description="Yeni tenant açın, paket seçin, askıya alın, erişim kodlarını yönetin ve limitleri takip edin."
      />

      <AdminTenantsManager initialTenants={tenants} activeTab={sekme === "demo" ? "demo" : "musteriler"} />
    </div>
  );
}