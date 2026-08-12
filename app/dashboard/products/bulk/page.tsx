import { Header } from "@/components/dashboard/header";
import { BulkOperationsPanel } from "@/components/dashboard/bulk-operations-panel";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getEffectiveProductLimit } from "@/lib/billing/plans";
import { getTenantProductCount } from "@/lib/data";

export default async function ProductBulkPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const productCount = await getTenantProductCount(tenant.id);

  const limit = getEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon);
  const usage = {
    total: productCount,
    limit,
    remaining: Math.max(limit - productCount, 0),
  };

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürün Yönetimi"
        title="Toplu Ürün Ekleme"
        description="Excel/CSV ile yüzlerce ürünü tek seferde ekleyin veya toplu resim yükleyin."
      />
      <BulkOperationsPanel tenant={tenant} usage={usage} />
    </div>
  );
}
