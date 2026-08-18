import { Header } from "@/components/dashboard/header";
import { BestSellersSettings } from "@/components/dashboard/best-sellers-settings";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function BestSellersPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  const settings = await getTenantStorefrontSettings(tenant.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="En Çok Satanlar"
        description="Bu bölümdeki ürünler siz seçmezsiniz — sistem son 30 gün içinde gerçekten en çok sepete eklenen ürünleri otomatik olarak listeler. Ürün listesi her gün kendiliğinden güncellenir."
      />
      <BestSellersSettings
        initialIsVisible={settings.is_best_sellers_visible}
        initialTitle={settings.best_sellers_title}
        initialProductCount={settings.best_sellers_product_count}
      />
    </div>
  );
}
