import { Header } from "@/components/dashboard/header";
import { PriceListsManager } from "@/components/dashboard/price-lists-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantPriceLists } from "@/lib/data";

export default async function TenantPriceListsPage() {
  const session = await requireTenantAdminPage();
  const priceLists = await getTenantPriceLists(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Fiyat Listeleri"
        title="Adlandırılabilir fiyat listelerinizi yönetin"
        description="Erişim kodlarını bu listelere bağlayın. Fiyatsız katalog tüm planlarda hazır gelir."
      />

      <PriceListsManager tenant={session.tenant!} initialPriceLists={priceLists} />
    </div>
  );
}
