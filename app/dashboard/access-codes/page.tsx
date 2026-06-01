import { AccessCodesManager } from "@/components/dashboard/access-codes-manager";
import { Header } from "@/components/dashboard/header";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantAccessCodes, getTenantPriceLists } from "@/lib/data";

export default async function TenantAccessCodesPage() {
  const session = await requireTenantAdminPage();
  const [codes, priceLists] = await Promise.all([
    getTenantAccessCodes(session.tenant!.id),
    getTenantPriceLists(session.tenant!.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Şifre Yönetimi"
        title="Müşteri vitrini için fiyat listesi bazlı kodlar yönetin"
        description="Her kod bir fiyat listesine bağlanır. Fiyatsız katalog kodu fiyat göstermez."
      />

      <AccessCodesManager
        tenant={session.tenant!}
        initialCodes={codes}
        priceLists={priceLists}
      />
    </div>
  );
}