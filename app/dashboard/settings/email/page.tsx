import { Header } from "@/components/dashboard/header";
import { TenantEmailSettingsForm } from "@/components/dashboard/tenant-email-settings-form";
import { buildPackageUpgradeHref, getPlanLabel, type TenantPlan } from "@/lib/billing/plans";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { canReceiveOrderEmails } from "@/lib/orders/order-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "E-posta Bildirimleri" };

export default async function TenantEmailSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const supabase = createSupabaseAdminClient();
  const { data } = supabase
    ? await supabase.from("tenants").select("contact_email, order_email_enabled").eq("id", tenant.id).maybeSingle()
    : { data: null };
  const plan = tenant.plan as TenantPlan;
  // Panel giriş e-postası (Supabase Auth) bildirim adresinden ayrıdır; bilgi için gösterilir.
  const loginEmail =
    supabase && session.userId
      ? ((await supabase.auth.admin.getUserById(session.userId)).data.user?.email ?? null)
      : null;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / E-posta Bildirimleri"
        title="E-posta Bildirimleri"
        description="Siparişlerin ve hesap bildirimlerinin gideceği e-posta adresi."
      />
      <TenantEmailSettingsForm
        initialEmail={data?.contact_email ?? ""}
        initialOrderEmailEnabled={data?.order_email_enabled !== false}
        paidPlan={canReceiveOrderEmails(plan)}
        planName={getPlanLabel(plan)}
        loginEmail={loginEmail}
        upgradeHref={buildPackageUpgradeHref(tenant.company_name)}
      />
    </div>
  );
}
