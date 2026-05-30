import { Header } from "@/components/dashboard/header";
import { TenantStorefrontDisplayForm } from "@/components/dashboard/tenant-storefront-display-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantStorefrontDisplayPage() {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Vitrin"
        title="Vitrin Görünüm Ayarları"
        description="Anasayfa header alanında gösterilecek fiyat güncelleme tarihini yönetin."
      />

      <TenantStorefrontDisplayForm initialStorefrontSettings={storefrontSettings} />
    </div>
  );
}
