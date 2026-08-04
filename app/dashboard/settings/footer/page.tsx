import { Header } from "@/components/dashboard/header";
import { TenantFooterSettingsForm } from "@/components/dashboard/tenant-footer-settings-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantFooterSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Footer"
        title="Footer (Sayfa Altı)"
        description="Adres, iletişim, sosyal medya ve telif bilgilerini yönetin."
      />

      <TenantFooterSettingsForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
