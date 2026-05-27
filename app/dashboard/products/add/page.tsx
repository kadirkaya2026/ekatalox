import { Header } from "@/components/dashboard/header";
import { ProductAddForm } from "@/components/dashboard/product-add-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories } from "@/lib/data";

export default async function ProductAddPage() {
  const session = await requireTenantAdminPage();
  const categories = await getTenantCategories(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Ürün Ekle"
        description="Tekil ürün ekleyin, fiyat katmanlarını ve stok durumunu tanımlayın."
      />
      <ProductAddForm tenant={session.tenant!} initialCategories={categories} />
    </div>
  );
}
