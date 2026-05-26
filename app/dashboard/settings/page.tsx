import { Header } from "@/components/dashboard/header";
import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantSettingsPage(
  props: PageProps<"/dashboard/settings">,
) {
  const session = await requireTenantAdminPage();
  const searchParams = await props.searchParams;
  const forcePasswordChange = searchParams.forcePasswordChange === "1";
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Tenant Ayarları"
        title="Storefront yönlendirme ve tenant detayları"
        description="WhatsApp sipariş numarasını yönetin ve tenant paketinizi görüntüleyin."
      />

      <TenantSettingsForm
        tenant={session.tenant!}
        profile={session.profile!}
        initialStorefrontSettings={storefrontSettings}
        forcePasswordChange={forcePasswordChange}
      />
    </div>
  );
}