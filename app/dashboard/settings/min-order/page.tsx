import { Header } from "@/components/dashboard/header";
import { TenantMinCartAmountForm } from "@/components/dashboard/tenant-min-cart-amount-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantMinCartAmountSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Minimum Sepet Tutarı"
        title="Minimum Sepet Tutarı"
        description="Sipariş verilebilmesi için sepetin ulaşması gereken en az tutarı belirleyin, ya da hiç minimum uygulamadan sipariş almaya devam edin."
      />

      <TenantMinCartAmountForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
