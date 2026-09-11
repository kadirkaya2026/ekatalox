import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { VisitorProvincesPanel } from "@/components/dashboard/visitor-provinces-panel";
import { Card } from "@/components/ui/card";
import { getTenantVisitorProvinceReport } from "@/lib/analytics/province-queries";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasPlanFeature } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function VisitorProvincesPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "general") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Raporlar"
          title="Ziyaretçi İlleri"
          description="Bu rapor yalnız toptancı hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">Hesabınız bu rapora sahip değil.</Card>
      </div>
    );
  }

  const canUseReports = hasPlanFeature(tenant.plan, "reports");
  const report = canUseReports ? await getTenantVisitorProvinceReport(tenant.id, "daily", {
        isPasswordProtected: tenant.is_password_protected,
        magnetLoginEnabled: tenant.magnet_login_enabled,
      }) : null;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Ziyaretçi İlleri"
        description="Mağazanıza giren tekil ziyaretçilerin hangi ilden bağlandığı; il il kişi sayısı ve payı. Konum, ziyaretçinin internet bağlantısından tahmin edilir."
      />

      <PlanFeatureGate feature="reports" plan={tenant.plan} companyName={tenant.company_name}>
        {report ? <VisitorProvincesPanel initialReport={report} /> : null}
      </PlanFeatureGate>
    </div>
  );
}
