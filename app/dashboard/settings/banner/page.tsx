import { Header } from "@/components/dashboard/header";
import { HeroClusterBannerForm } from "@/components/dashboard/hero-cluster-banner-form";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { TenantBannerForm } from "@/components/dashboard/tenant-banner-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantBannerSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Anasayfa Banner'ı"
        title="Anasayfa Banner Görselleri"
        description="Mağaza vitrin carousel alanı için kampanya, duyuru ve indirim banner'ları yönetin. Bu banner yalnızca anasayfa vitrin carousel'ında görünür — kategori sayfalarındaki banner'lar Kategoriler ekranından ayrı yönetilir."
      />

      <PlanFeatureGate feature="banner_settings" plan={tenant.plan} companyName={tenant.company_name}>
        <div className="space-y-6">
          <TenantBannerForm initialStorefrontSettings={storefrontSettings} />
          <HeroClusterBannerForm initialStorefrontSettings={storefrontSettings} />
        </div>
      </PlanFeatureGate>
    </div>
  );
}
