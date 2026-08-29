import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import { DealerPushOptIn } from "@/components/dashboard/dealer-push-opt-in";
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
        description="Gelen siparişi onaylayın, hazırlayın, teslim edin. Müşteri her adımı takip sayfasından ve bildirimle görür."
      />
      <DealerPushOptIn vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      <OrdersManager
        initialPage={initialPage}
        tenantName={tenant.company_name}
        isTekel={Boolean(tenant.is_tekel)}
      />
    </div>
  );
}
