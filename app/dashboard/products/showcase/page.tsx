import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ShowcaseManager } from "@/components/dashboard/showcase/showcase-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasPlanFeature } from "@/lib/billing/plans";
import { getTenantCategories, getTenantProducts, getTenantStorefrontSections } from "@/lib/data";

export default async function ShowcasePage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const tenantId = tenant.id;
  const canUseShowcase = hasPlanFeature(tenant.plan, "showcase_products");

  const [sections, products, categories] = canUseShowcase
    ? await Promise.all([
        getTenantStorefrontSections(tenantId),
        getTenantProducts(tenantId),
        getTenantCategories(tenantId),
      ])
    : [[], [], []];

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Vitrin Ürünleri"
        description="Anasayfada öne çıkarmak istediğiniz ürün bölümlerini oluşturun. En fazla 3 bölüm eklenebilir. Her bölümde 8'den fazla ürün varsa ziyaretçilere «Devamı» butonu gösterilir."
      />
      <PlanFeatureGate
        feature="showcase_products"
        plan={tenant.plan}
        companyName={tenant.company_name}
      >
        <ShowcaseManager
          tenantId={tenantId}
          initialSections={sections}
          allProducts={products}
          allCategories={categories}
        />
      </PlanFeatureGate>
    </div>
  );
}
