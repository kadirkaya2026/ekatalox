import { Header } from "@/components/dashboard/header";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import { DealerPushOptIn } from "@/components/dashboard/dealer-push-opt-in";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantOrdersPage } from "@/lib/orders/data";

export const metadata = { title: "Siparişler" };

export const dynamic = "force-dynamic";

export default async function TenantOrdersPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  const initialPage = await getTenantOrdersPage(tenant.id, { status: "all", page: 1 });

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Siparişler"
        title="Siparişler"
        description={
          tenant.business_type === "market"
            ? "Gelen siparişi onaylayın, hazırlayın, teslim edin. Müşteri her adımı takip sayfasından ve bildirimle görür."
            : "Katalogdan gelen tüm siparişler burada kayıtlı. Onaylayın, hazırlayın, teslim edin; PDF fişi her zaman WhatsApp ile de gelir."
        }
      />
      <DealerPushOptIn vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      <OrdersManager
        initialPage={initialPage}
        tenantName={tenant.company_name}
        isTekel={Boolean(tenant.is_tekel)}
        isWholesale={tenant.business_type !== "market"}
        orderEditEnabled={Boolean(tenant.order_edit_enabled)}
      />
    </div>
  );
}
