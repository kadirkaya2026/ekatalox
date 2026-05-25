import { AccessCodesManager } from "@/components/dashboard/access-codes-manager";
import { Header } from "@/components/dashboard/header";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantAccessCodes } from "@/lib/data";

export default async function TenantAccessCodesPage() {
  const session = await requireTenantAdminPage();
  const codes = await getTenantAccessCodes(session.tenant!.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Şifre Yönetimi"
        title="Müşteri vitrini için fiyat katmanı bazlı kodlar yönetin"
        description="Her kod yalnız tek bir fiyat katmanına karşılık gelir. Frontend yalnız ilgili fiyatı alır."
      />

      <AccessCodesManager tenant={session.tenant!} initialCodes={codes} />
    </div>
  );
}