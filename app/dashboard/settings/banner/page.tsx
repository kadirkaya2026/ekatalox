import { Header } from "@/components/dashboard/header";
import { TenantBannerForm } from "@/components/dashboard/tenant-banner-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantBannerSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Banner"
        title="Banner Ayarları"
        description="Storefront carousel alanı için kampanya, duyuru ve indirim banner'ları yönetin."
      />

      <TenantBannerForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
