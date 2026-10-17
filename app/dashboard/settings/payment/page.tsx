import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { SettingsTabShell } from "@/components/dashboard/settings-tab-shell";
import { TenantPaymentMethodsForm } from "@/components/dashboard/tenant-payment-methods-form";
import { TenantPaymentSettingsForm } from "@/components/dashboard/tenant-payment-settings-form";
import { getTenantStorefrontSettings } from "@/lib/data";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getLegalProfileProblems, readLegalProfile } from "@/lib/legal/tenant-legal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantPaymentProviderSummary } from "@/lib/payments/credentials";
import { getOnlinePaymentProblems } from "@/lib/payments/readiness";
import { appEnv } from "@/lib/env";

export const metadata = { title: "Ödeme ve Kampanyalar" };

// 28 Eyl 2026: iki sekme. "Ödeme" (yöntemler, IBAN, online ödeme tercihleri)
// tüm paketlerde; "Ödeme Kampanyaları" (nakit/havale/kart iskontoları, taksit)
// payment_settings özelliği olan paketlerde.
export default async function PaymentSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
  const admin = createSupabaseAdminClient();
  const onlineProvider = admin ? await getTenantPaymentProviderSummary(admin, tenant.id) : null;
  const onlineProblems = admin
    ? await getOnlinePaymentProblems({
        supabase: admin,
        tenantId: tenant.id,
        plan: tenant.plan,
        legalProfile: storefrontSettings.legal_profile,
      })
    : ["Sunucu yapılandırması eksik"];
  // PayTR Bildirim URL'i mağazanın kendi adresinde (özel alan adı varsa o).
  const storefrontOrigin = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;

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
          methods: (
            <TenantPaymentMethodsForm
              storefrontSettings={storefrontSettings}
              plan={tenant.plan}
              legalProblems={getLegalProfileProblems(readLegalProfile(storefrontSettings.legal_profile))}
              onlineProvider={onlineProvider}
              onlineProblems={onlineProblems}
              paytrNotifyUrl={`${storefrontOrigin}/api/payments/paytr/notify`}
              paynetEgressIp={process.env.PAYNET_EGRESS_IP?.trim() || null}
            />
          ),
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
