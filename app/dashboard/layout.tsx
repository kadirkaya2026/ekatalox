import type { Metadata } from "next";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { NewOrderWatcher } from "@/components/dashboard/new-order-watcher";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TrialExpiredModal } from "@/components/dashboard/trial-expired-modal";
import { VisitorQuotaBanner } from "@/components/dashboard/visitor-quota-banner";
import { getSessionContext, requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import { getCurrentMonthVisitorCount } from "@/lib/analytics/queries";
import { getVisitorLimitForPlan } from "@/lib/billing/plans";
import { getTenantSuggestionNoticeCount } from "@/lib/products/suggestions";
import { getTenantNewOrderCount } from "@/lib/orders/data";
import {
  getTrialDaysLeft,
  isTrialExpired,
  isTrialTenant,
} from "@/lib/billing/trial";

// iPhone'da bildirim yalnız ana ekrana eklenmiş panelde çalışır. Ana ekran
// ikonu ve adı BAYİNİN logosu/adı olsun (eKatalox değil): manifest tenant'a
// özel üretilir, apple-touch-icon bayinin logosundan gelir.
export async function generateMetadata(): Promise<Metadata> {
  const session = await getSessionContext();
  const tenant = session.tenant;
  if (!tenant) return { manifest: "/panel.webmanifest" };
  const settings = await getTenantStorefrontSettings(tenant.id);
  const name = settings.storefront_title?.trim() || tenant.company_name;
  const icon = settings.logo_url || settings.site_favicon_url || "/ekatalox-logo-v2.png";
  return {
    manifest: `/api/tenant/panel-manifest?tenant=${tenant.id}`,
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    icons: { apple: icon },
  };
}

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
        {tenant?.business_type === "market" ? <NewOrderWatcher initialNewCount={newOrderCount} /> : null}
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