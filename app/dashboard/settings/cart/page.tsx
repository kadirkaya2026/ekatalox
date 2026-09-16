import { Header } from "@/components/dashboard/header";
import { TenantCartFormSettings } from "@/components/dashboard/tenant-cart-form-settings";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantCartFormSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Sepet Ayarları"
        title="Sepet Ayarları"
        description="Sipariş formunda müşteriden istenen alanları (cari adı, telefon, adres, not) açıp kapatın, zorunlu yapın ve etiketlerini kendinize göre yazın."
      />

      <TenantCartFormSettings
        initialStorefrontSettings={storefrontSettings}
        businessType={session.tenant!.business_type ?? null}
      />
    </div>
  );
}
