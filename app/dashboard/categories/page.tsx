import { CategoriesManager } from "@/components/dashboard/categories-manager";
import { Header } from "@/components/dashboard/header";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories } from "@/lib/data";

export default async function TenantCategoriesPage() {
  const session = await requireTenantAdminPage();
  const categories = await getTenantCategories(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kategori Yönetimi"
        title="Ürün kategorilerini yönetin"
        description="Storefront filtreleri ve ürün yönetimi için kategorileri buradan oluşturup kaldırın."
      />

      <CategoriesManager
        tenant={session.tenant!}
        initialCategories={categories}
      />
    </div>
  );
}