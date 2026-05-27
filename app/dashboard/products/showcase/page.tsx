import { Header } from "@/components/dashboard/header";
import { ShowcaseManager } from "@/components/dashboard/showcase/showcase-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories, getTenantProducts, getTenantStorefrontSections } from "@/lib/data";

export default async function ShowcasePage() {
  const session = await requireTenantAdminPage();
  const tenantId = session.tenant!.id;

  const [sections, products, categories] = await Promise.all([
    getTenantStorefrontSections(tenantId),
    getTenantProducts(tenantId),
    getTenantCategories(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Vitrin Ürünleri"
        description="Anasayfada öne çıkarmak istediğiniz ürün bölümlerini oluşturun. En fazla 3 bölüm eklenebilir. Her bölümde 8'den fazla ürün varsa ziyaretçilere «Devamı» butonu gösterilir."
      />
      <ShowcaseManager
        tenantId={tenantId}
        initialSections={sections}
        allProducts={products}
        allCategories={categories}
      />
    </div>
  );
}
