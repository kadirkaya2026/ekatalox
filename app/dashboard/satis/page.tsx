import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { SalesReportPanel } from "@/components/dashboard/sales-report-panel";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasPlanFeature } from "@/lib/billing/plans";
import { resolvePreset } from "@/lib/sales/presets";
import { getSalesReport } from "@/lib/sales/queries";

export const dynamic = "force-dynamic";

export default async function SalesReportPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Raporlar"
          title="Satış & Kârlılık"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">Hesabınız satış raporlarına sahip değil.</Card>
      </div>
    );
  }

  const canUse = hasPlanFeature(tenant.plan, "sales_accounting");
  const initial = resolvePreset("this_month");
  const report = canUse ? await getSalesReport(tenant.id, { ...initial, preset: "this_month" }) : null;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Satış & Kârlılık"
        description="Vitrinden gelen ve teslim edilen siparişlerin cirosu, maliyeti ve kârı; gün, hafta veya ay bazında. Kâr, ürünlere girdiğiniz alış fiyatından hesaplanır."
      />
      <PlanFeatureGate feature="sales_accounting" plan={tenant.plan} companyName={tenant.company_name}>
        {report ? <SalesReportPanel initialReport={report} /> : null}
      </PlanFeatureGate>
    </div>
  );
}
