import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { StockImportPanel } from "@/components/dashboard/stock-import-panel";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantPriceLists } from "@/lib/data";

export default async function StockImportPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Ürün Yönetimi"
          title="Stok Listesi Yükle"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">
          Hesabınız stok listesi içe aktarma özelliğine sahip değil.
        </Card>
      </div>
    );
  }

  const priceLists = await getTenantPriceLists(tenant.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Stok Listesi Yükle"
        description="Barkod okuyucu / market otomasyon yazılımınızdan aldığınız Excel/CSV stok listesini yükleyin; sistem ürünlerinizle otomatik eşleştirsin."
      />
      <StockImportPanel priceLists={priceLists} />
    </div>
  );
}
