import { Header } from "@/components/dashboard/header";
import { ProductsManager } from "@/components/dashboard/products-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories, getTenantProducts } from "@/lib/data";

export default async function TenantProductsPage() {
  const session = await requireTenantAdminPage();
  const [products, categories] = await Promise.all([
    getTenantProducts(session.tenant!.id),
    getTenantCategories(session.tenant!.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Ürünleri masaüstünde tablo, mobilde kart görünümüyle yönetin"
        description="CSV import, tekil ürün ekleme, düzenleme modalı, stok yönetimi ve Supabase Storage görsel yükleme bu ekranda toplanır."
      />

      <ProductsManager
        tenant={session.tenant!}
        initialProducts={products}
        initialCategories={categories}
      />
    </div>
  );
}