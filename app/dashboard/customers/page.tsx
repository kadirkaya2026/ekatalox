import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { CustomersManager } from "@/components/dashboard/customers-manager";
import { IpBlocksManager } from "@/components/dashboard/ip-blocks-manager";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCustomersOverview } from "@/lib/customers/data";

export default async function TenantCustomersPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Raporlar"
          title="Cari Hesaplar"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">
          Hesabınız müşteri raporlarına sahip değil.
        </Card>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();
  const [customers, { data: ipBlockRows }] = await Promise.all([
    getTenantCustomersOverview(tenant.id),
    supabase
      ? supabase
          .from("storefront_ip_blocks")
          .select("id, ip, reason, blocked_until, created_at, updated_at")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Cari Hesaplar"
        description="Sipariş veren her müşteri burada: kim ne kadar alışveriş yaptı, en son ne zaman sipariş verdi."
      />
      <CustomersManager initialCustomers={customers} isTekel={Boolean(tenant.is_tekel)} />
      <IpBlocksManager initialBlocks={ipBlockRows ?? []} />
    </div>
  );
}
