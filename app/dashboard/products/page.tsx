import { Header } from "@/components/dashboard/header";
import { ProductsPageShell } from "@/components/dashboard/products-page-shell";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories, getTenantPriceLists, getTenantProductsPage } from "@/lib/data";

export default async function TenantProductsPage() {
  const session = await requireTenantAdminPage();
  const [firstPage, categories, priceLists] = await Promise.all([
    getTenantProductsPage({ tenantId: session.tenant!.id, page: 1 }),
    getTenantCategories(session.tenant!.id),
    getTenantPriceLists(session.tenant!.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Ürünler"
        description="Ürün listesini yönetin. Tekil ürün eklemek için «Ürün Ekle», toplu içe aktarma için «Toplu Ürün Ekleme» sayfasını kullanın."
      />
      <ProductsPageShell
        tenant={session.tenant!}
        initialProducts={firstPage.products}
        initialTotal={firstPage.total}
        initialCategories={categories}
        priceLists={priceLists}
      />
    </div>
  );
}
