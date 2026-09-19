import { Header } from "@/components/dashboard/header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { requireTenantAdminPage } from "@/lib/auth/session";

// Tüm ayar sayfaları artık tek bir "Ayarlar" ekranında; solda dikey sekmeler,
// sağda ilgili formun kendisi (rotalar ve formlar aynı kaldı). 360katalog
// benzeri düzen. Her alt sayfa kendi başlığını sağ sütunda gösterir.
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTenantAdminPage();
  const plan = session.tenant?.plan ?? "baslangic";
  const businessType = session.tenant?.business_type ?? "market";

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Yönetim"
        title="Ayarlar"
        description="Mağazanızın görünümünü, sipariş ve üyelik ayarlarını buradan yönetin."
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsNav plan={plan} businessType={businessType} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
