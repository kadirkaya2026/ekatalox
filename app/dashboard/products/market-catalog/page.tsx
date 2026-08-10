import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { MarketCatalogPicker } from "@/components/dashboard/market-catalog-picker";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getEffectiveProductLimit } from "@/lib/billing/plans";
import { getMarketCatalogProductsPage, getTenantProducts } from "@/lib/data";

export default async function MarketCatalogPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Ürün Yönetimi"
          title="Master Katalog"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">
          Hesabınız market kataloğu erişimine sahip değil.
        </Card>
      </div>
    );
  }

  const [catalogPage, products] = await Promise.all([
    getMarketCatalogProductsPage({ page: 1 }),
    getTenantProducts(tenant.id),
  ]);

  const importedSkuCodes = new Set(products.map((product) => product.sku_code));
  const limit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);
  const usage = {
    total: products.length,
    limit,
    remaining: Math.max(limit - products.length, 0),
  };

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Master Katalog"
        description="eKatalox'un ortak market ürün havuzundan kendi mağazanıza ürün seçip aktarın. Aktarılan ürünler stoksuz olarak eklenir; fiyat ve stok bilgisini siz düzenlersiniz."
      />
      <MarketCatalogPicker
        initialCatalog={catalogPage.products}
        initialTotal={catalogPage.total}
        importedSkuCodes={[...importedSkuCodes]}
        usage={usage}
      />
    </div>
  );
}
