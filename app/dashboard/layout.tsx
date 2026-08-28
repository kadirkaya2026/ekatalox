import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TrialExpiredModal } from "@/components/dashboard/trial-expired-modal";
import { VisitorQuotaBanner } from "@/components/dashboard/visitor-quota-banner";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getCurrentMonthVisitorCount } from "@/lib/analytics/queries";
import { getVisitorLimitForPlan } from "@/lib/billing/plans";
import { getTenantSuggestionNoticeCount } from "@/lib/products/suggestions";
import { getTenantNewOrderCount } from "@/lib/orders/data";
import {
  getTrialDaysLeft,
  isTrialExpired,
  isTrialTenant,
} from "@/lib/billing/trial";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireTenantAdminPage();
  const plan = session.tenant?.plan ?? "baslangic";
  const tenant = session.tenant;
  const trialExpired = tenant ? isTrialExpired(tenant) : false;
  const trialDaysLeft =
    tenant && isTrialTenant(tenant) && !trialExpired
      ? getTrialDaysLeft(tenant)
      : null;
  const [monthlyVisitorCount, suggestionNoticeCount, newOrderCount] = tenant
    ? await Promise.all([
        getCurrentMonthVisitorCount(tenant.id),
        getTenantSuggestionNoticeCount(tenant.id),
        tenant.business_type === "market" ? getTenantNewOrderCount(tenant.id) : Promise.resolve(0),
      ])
    : [0, 0, 0];

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:h-screen md:grid-cols-[280px_1fr] md:overflow-hidden">
      <MobileDashboardNav
        mode="tenant"
        title={tenant?.company_name ?? "Tenant Paneli"}
        subtitle={tenant?.subdomain ?? "yönetim"}
        plan={plan}
        businessType={tenant?.business_type}
        suggestionNoticeCount={suggestionNoticeCount}
        newOrderCount={newOrderCount}
      />
      <div className="hidden md:block md:h-screen">
        <Sidebar
          mode="tenant"
          title={tenant?.company_name ?? "Tenant Paneli"}
          subtitle={tenant?.subdomain ?? "yönetim"}
          plan={plan}
          businessType={tenant?.business_type}
          suggestionNoticeCount={suggestionNoticeCount}
          newOrderCount={newOrderCount}
        />
      </div>
      <main className="container-shell py-6 md:h-screen md:overflow-y-auto">
        {trialDaysLeft !== null ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">Deneme hesabı:</span> Deneme
            sürenizin bitmesine <strong>{trialDaysLeft} gün</strong> kaldı.
            Kesintisiz devam etmek için süre dolmadan bir paket seçebilirsiniz.
          </div>
        ) : null}
        {tenant ? (
          <VisitorQuotaBanner
            tenant={tenant}
            used={monthlyVisitorCount}
            limit={getVisitorLimitForPlan(tenant.plan, tenant.visitor_limit_addon)}
          />
        ) : null}
        {children}
      </main>
      {trialExpired && tenant ? (
        <TrialExpiredModal
          companyName={tenant.company_name}
          subdomain={tenant.subdomain}
        />
      ) : null}
    </div>
  );
}