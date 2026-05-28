import { Header } from "@/components/dashboard/header";
import { TenantPaymentSettingsForm } from "@/components/dashboard/tenant-payment-settings-form";
import { getTenantStorefrontSettings } from "@/lib/data";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function PaymentSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ödeme Ayarları"
        title="Nakit, kart ve taksit kampanyaları"
        description="Ödeme yöntemine göre iskonto tanımlayın, taksit seçeneklerini ve vade farklarını yönetin. Ayarlar storefront ve WhatsApp sipariş metnine otomatik yansır."
      />

      <TenantPaymentSettingsForm storefrontSettings={storefrontSettings} />
    </div>
  );
}
