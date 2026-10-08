import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { SettingsTabShell } from "@/components/dashboard/settings-tab-shell";
import { TenantPaymentMethodsForm } from "@/components/dashboard/tenant-payment-methods-form";
import { TenantPaymentSettingsForm } from "@/components/dashboard/tenant-payment-settings-form";
import { getTenantStorefrontSettings } from "@/lib/data";
import { requireTenantAdminPage } from "@/lib/auth/session";

export const metadata = { title: "Ödeme ve Kampanyalar" };

// 28 Eyl 2026: iki sekme. "Ödeme" (yöntemler, IBAN, online ödeme tercihleri)
// tüm paketlerde; "Ödeme Kampanyaları" (nakit/havale/kart iskontoları, taksit)
// payment_settings özelliği olan paketlerde.
export default async function PaymentSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Ödeme ve Kampanyalar"
        title="Ödeme ve Kampanyalar"
        description="Müşterilerinizin sepette göreceği ödeme yöntemlerini seçin; nakit, havale ve kart için iskonto ve taksit kampanyaları tanımlayın."
      />

      <SettingsTabShell
        layoutId="payment-settings-main-tabs"
        tabs={[
          { key: "methods", label: "Ödeme" },
          { key: "campaigns", label: "Ödeme Kampanyaları" },
        ]}
        panels={{
          methods: <TenantPaymentMethodsForm storefrontSettings={storefrontSettings} plan={tenant.plan} />,
          campaigns: (
            <PlanFeatureGate feature="payment_settings" plan={tenant.plan} companyName={tenant.company_name}>
              <TenantPaymentSettingsForm storefrontSettings={storefrontSettings} />
            </PlanFeatureGate>
          ),
        }}
      />
    </div>
  );
}
