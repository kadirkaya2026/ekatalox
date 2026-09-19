import { Header } from "@/components/dashboard/header";
import { TenantCartFormSettings } from "@/components/dashboard/tenant-cart-form-settings";
import { TenantMinCartAmountForm } from "@/components/dashboard/tenant-min-cart-amount-form";
import { CartRecommendationsCard } from "@/components/dashboard/cart-recommendations-card";
import { SettingsTabShell } from "@/components/dashboard/settings-tab-shell";
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

      <SettingsTabShell
        layoutId="cart-settings-tabs"
        tabs={[
          { key: "form", label: "Sipariş formu alanları" },
          { key: "min", label: "Minimum sepet tutarı" },
          { key: "recommendations", label: "Sepet ürün önerileri" },
        ]}
        panels={{
          form: (
            <TenantCartFormSettings
              initialStorefrontSettings={storefrontSettings}
              businessType={session.tenant!.business_type ?? null}
            />
          ),
          min: <TenantMinCartAmountForm initialStorefrontSettings={storefrontSettings} />,
          recommendations: (
            <CartRecommendationsCard initialMode={storefrontSettings.recommendation_mode} />
          ),
        }}
      />
    </div>
  );
}
