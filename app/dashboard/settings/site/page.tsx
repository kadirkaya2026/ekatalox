import { Header } from "@/components/dashboard/header";
import { TenantSiteIdentityForm } from "@/components/dashboard/tenant-site-identity-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantSiteIdentityPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Site Kimliği"
        title="Site Kimliği"
        description="Mağaza logosu, vitrin başlığı, kısa açıklama, tarayıcı sekmesi, favicon ve duyuru modalını yönetin."
      />

      <TenantSiteIdentityForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
