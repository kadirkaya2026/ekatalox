import { Header } from "@/components/dashboard/header";
import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function TenantSettingsPage() {
  const session = await requireTenantAdminPage();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Tenant Ayarları"
        title="Storefront yönlendirme ve tenant detayları"
        description="WhatsApp sipariş numarasını yönetin ve tenant paketinizi görüntüleyin."
      />

      <TenantSettingsForm tenant={session.tenant!} />
    </div>
  );
}