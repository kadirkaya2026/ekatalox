import { Header } from "@/components/dashboard/header";
import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function TenantSettingsPage(
  props: PageProps<"/dashboard/settings">,
) {
  const session = await requireTenantAdminPage();
  const searchParams = await props.searchParams;
  const forcePasswordChange = searchParams.forcePasswordChange === "1";

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Hesap Ayarları"
        title="Sipariş yönlendirme ve üyelik bilgileri"
        description="WhatsApp sipariş numarasını yönetin ve üyelik bilgilerinizi görüntüleyin."
      />

      <TenantSettingsForm
        tenant={session.tenant!}
        profile={session.profile!}
        forcePasswordChange={forcePasswordChange}
      />
    </div>
  );
}