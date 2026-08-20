// Katalog süper admin tarafından düzenlendiği için her ziyarette güncel
// olmalı — kendi düzenlemesini eski haliyle görmesin.
export const dynamic = "force-dynamic";

import { MarketCatalogManager } from "@/components/admin/market-catalog-manager";
import { Header } from "@/components/dashboard/header";
import { MARKET_CATALOG_PAGE_SIZE, getMarketCatalogProductsPage } from "@/lib/data";

export default async function AdminMarketCatalogPage() {
  const firstPage = await getMarketCatalogProductsPage({ page: 1 });

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Master Katalog"
        description="Tüm marketlerin ortak ürün havuzu. Ürün adı, barkod, marka, kategori, referans fiyat, açıklama ve görseli buradan düzenlenir — bu katalogda değişiklik yapma yetkisi yalnızca süper adminde."
      />
      <MarketCatalogManager
        initialProducts={firstPage.products}
        initialTotal={firstPage.total}
        pageSize={MARKET_CATALOG_PAGE_SIZE}
      />
    </div>
  );
}
