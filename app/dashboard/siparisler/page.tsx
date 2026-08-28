import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantOrdersPage } from "@/lib/orders/data";

export const dynamic = "force-dynamic";

export default async function TenantOrdersPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Siparişler"
          title="Siparişler"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">Hesabınız sipariş yönetimine sahip değil.</Card>
      </div>
    );
  }

  const initialPage = await getTenantOrdersPage(tenant.id, { status: "all", page: 1 });

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Siparişler"
        title="Siparişler"
        description="Vitrinden gelen siparişleri onaylayın, hazırlanıyor / yola çıktı / teslim edildi olarak işaretleyin. Müşteri, takip sayfasından ve açtıysa tarayıcı bildirimiyle her adımı görür. Ciro ve kâr yalnızca teslim edilen siparişlerden hesaplanır."
      />
      <OrdersManager
        initialPage={initialPage}
        tenantName={tenant.company_name}
        isTekel={Boolean(tenant.is_tekel)}
      />
    </div>
  );
}
