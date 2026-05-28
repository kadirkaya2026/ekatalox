import { Header } from "@/components/dashboard/header";
import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { getTenantStorefrontSettings } from "@/lib/data";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function TenantSettingsPage(
  props: PageProps<"/dashboard/settings">,
) {
  const session = await requireTenantAdminPage();
  const storefrontSettings = await getTenantStorefrontSettings(session.tenant!.id);
  const searchParams = await props.searchParams;
  const forcePasswordChange = searchParams.forcePasswordChange === "1";

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Hesap Ayarları"
        title="Sipariş, iskontolar ve üyelik bilgileri"
        description="WhatsApp yönlendirmesini, barajlı sepet iskontosunu ve üyelik bilgilerinizi tek ekrandan yönetin."
      />

      <TenantSettingsForm
        tenant={session.tenant!}
        profile={session.profile!}
        storefrontSettings={storefrontSettings}
        forcePasswordChange={forcePasswordChange}
      />
    </div>
  );
}