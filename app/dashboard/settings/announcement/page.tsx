import { Header } from "@/components/dashboard/header";
import { BusyModeToggle } from "@/components/dashboard/busy-mode-toggle";
import { TenantAnnouncementForm } from "@/components/dashboard/tenant-announcement-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantAnnouncementSettingsPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Duyuru Modalı"
        title="Duyuru Modalı"
        description="Esnaf anasayfaya girdiğinde gösterilecek duyuru popup'ını yönetin."
      />

      <BusyModeToggle initialStorefrontSettings={storefrontSettings} />
      <TenantAnnouncementForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
