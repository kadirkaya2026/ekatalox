import { Header } from "@/components/dashboard/header";
import { TenantSiteIdentityForm } from "@/components/dashboard/tenant-site-identity-form";
import { TenantStorefrontDisplayForm } from "@/components/dashboard/tenant-storefront-display-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantIdentitySettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Mağaza Kimliği"
        title="Mağaza Kimliği"
        description="Mağaza logosu, vitrin başlığı, kısa açıklama, tarayıcı sekmesi, favicon, vitrin dili ve fiyat güncelleme tarihini yönetin."
      />

      <TenantSiteIdentityForm initialStorefrontSettings={storefrontSettings} />
      <TenantStorefrontDisplayForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
