import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { TenantDeliveryFeeForm } from "@/components/dashboard/tenant-delivery-fee-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantDeliveryFeeSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Ayarlar / Getirme Ücreti"
          title="Getirme Ücreti"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">
          Hesabınız getirme ücreti ayarına sahip değil.
        </Card>
      </div>
    );
  }

  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Getirme Ücreti"
        title="Getirme Ücreti"
        description="Siparişlere otomatik teslimat ücreti ekleyin; belirlediğiniz tutar ve üzeri siparişlerde ücreti kaldırın."
      />

      <TenantDeliveryFeeForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
