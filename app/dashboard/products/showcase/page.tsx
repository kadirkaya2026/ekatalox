import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ShowcaseManager } from "@/components/dashboard/showcase/showcase-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasPlanFeature } from "@/lib/billing/plans";
import { getTenantCategories, getTenantStorefrontSections } from "@/lib/data";

export default async function ShowcasePage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const tenantId = tenant.id;
  const canUseShowcase = hasPlanFeature(tenant.plan, "showcase_products");

  const [sections, categories] = canUseShowcase
    ? await Promise.all([
        getTenantStorefrontSections(tenantId),
        getTenantCategories(tenantId),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Öne Çıkan Bölümler"
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
          allCategories={categories}
        />
      </PlanFeatureGate>
    </div>
  );
}
