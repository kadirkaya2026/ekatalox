import { redirect } from "next/navigation";
import { readDesignDocument } from "@/lib/storefront/sector-design/config";
import { Header } from "@/components/dashboard/header";
import { TenantHomepageContentForm } from "@/components/dashboard/tenant-homepage-content-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantHomepageSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);
  if (readDesignDocument(storefrontSettings.sector_design, session.tenant!.sector)) redirect("/dashboard/settings/theme");

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Ana Sayfa İçerikleri"
        title="Ana Sayfa İçerikleri"
        description="Hero alanını ve (üst paketlerde) ana sayfa bölümlerinin sırasını/görünürlüğünü yönetin."
      />

      <TenantHomepageContentForm
        initialStorefrontSettings={storefrontSettings}
        tenantPlan={session.tenant!.plan ?? "baslangic"}
        companyName={session.tenant!.company_name}
      />
    </div>
  );
}
