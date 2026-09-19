import { Header } from "@/components/dashboard/header";
import { TenantCartFormSettings } from "@/components/dashboard/tenant-cart-form-settings";
import { TenantMinCartAmountForm } from "@/components/dashboard/tenant-min-cart-amount-form";
import { CartRecommendationsCard } from "@/components/dashboard/cart-recommendations-card";
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
        description="Sipariş formu alanları, minimum sepet tutarı ve sepetteki ürün önerileri; sepetle ilgili her şey bu sayfada."
      />

      <TenantCartFormSettings
        initialStorefrontSettings={storefrontSettings}
        businessType={session.tenant!.business_type ?? null}
      />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Minimum sepet tutarı</h2>
        <p className="text-sm text-slate-600">
          Sipariş verilebilmesi için sepetin ulaşması gereken en az tutar; istemezseniz kapalı bırakın.
        </p>
      </div>
      <TenantMinCartAmountForm initialStorefrontSettings={storefrontSettings} />

      <CartRecommendationsCard initialMode={storefrontSettings.recommendation_mode} />
    </div>
  );
}
