import { Header } from "@/components/dashboard/header";
import { TenantThemeForm } from "@/components/dashboard/tenant-theme-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantThemeSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Tema"
        title="Tema Ayarları"
        description="Tema, marka renkleri, font, kart stili ve ana sayfa bloklarını yönetin."
      />

      <TenantThemeForm
        initialStorefrontSettings={storefrontSettings}
        tenantPlan={session.tenant!.plan ?? "baslangic"}
      />
    </div>
  );
}
