import { Header } from "@/components/dashboard/header";
import { TenantBusinessHoursForm } from "@/components/dashboard/tenant-business-hours-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantBusinessHoursSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Çalışma Saatleri"
        title="Çalışma Saatleri"
        description="Mağazanızın 7/24 mü yoksa belirli saatlerde mi açık olacağını belirleyin. Kapalıyken vitrin, ziyaretçilere mağazanın kapalı olduğunu ve ne zaman açılacağını gösterir."
      />

      <TenantBusinessHoursForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
