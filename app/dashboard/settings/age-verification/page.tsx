import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { TenantAgeVerificationForm } from "@/components/dashboard/tenant-age-verification-form";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function TenantAgeVerificationSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Ayarlar"
          title="Yaş Doğrulama"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">
          Hesabınız yaş doğrulama ayarına sahip değil.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar"
        title="Yaş Doğrulama"
        description="Alkol, tütün gibi yaş sınırlı ürünler satıyorsanız, mağazanıza girişte ziyaretçiden 18 yaş onayı isteyebilirsiniz."
      />
      <TenantAgeVerificationForm tenant={tenant} />
    </div>
  );
}
