import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { TenantDomainForm } from "@/components/dashboard/tenant-domain-form";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function TenantDomainSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Özel Alan Adı"
        title="Özel Alan Adı"
        description="Mağazanızı kendi alan adınızla yayınlayın."
      />

      <PlanFeatureGate feature="custom_domain" plan={tenant.plan} companyName={tenant.company_name}>
        <TenantDomainForm tenant={tenant} />
      </PlanFeatureGate>
    </div>
  );
}
