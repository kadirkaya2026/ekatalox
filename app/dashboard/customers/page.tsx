import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { CustomersManager } from "@/components/dashboard/customers-manager";
import { IpBlocksManager } from "@/components/dashboard/ip-blocks-manager";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCustomersOverview } from "@/lib/customers/data";
import { getTenantCategories, getTenantPriceLists } from "@/lib/data";
import { DealerCustomersManager } from "@/components/dashboard/dealer-customers-manager";
import { buildCatalogOrigin, hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { getTenantDealerCustomers } from "@/lib/kurumsal/dealer-customers";
import type { Tenant } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Müşteriler" };

export default async function TenantCustomersPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return <DealerCustomersPage tenant={tenant} />;
  }

  const supabase = createSupabaseAdminClient();
  const [customers, { data: ipBlockRows }, categories] = await Promise.all([
    getTenantCustomersOverview(tenant.id),
    supabase
      ? supabase
          .from("storefront_ip_blocks")
          .select("id, ip, reason, blocked_until, created_at, updated_at")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    getTenantCategories(tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Müşteriler"
        title="Müşteriler"
        description="Sipariş veren her müşteri burada: kim ne kadar alışveriş yaptı, en son ne zaman sipariş verdi."
      />
      <CustomersManager initialCustomers={customers} isTekel={Boolean(tenant.is_tekel)} categories={categories} />
      <IpBlocksManager initialBlocks={ipBlockRows ?? []} />
    </div>
  );
}

// Toptancı (genel) tenant: onaylı bayi başvurularına verilen kişiye özel
// şifreler = müşteriler (0138). Yalnız Kurumsal paket.
async function DealerCustomersPage({ tenant }: { tenant: Tenant }) {
  const header = (
    <Header
      eyebrow="Müşteriler"
      title="Müşteriler"
      description="Bayi başvurusunu onayladığınız, kişiye özel şifre verdiğiniz müşteriler. Şifreyle girdiklerinde sepette bilgi sorulmaz, sipariş fişine otomatik yazılır."
    />
  );
  if (!hasKurumsalSiteAccess(tenant)) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="p-6 text-sm leading-6 text-muted-foreground">
          Kişiye özel şifreli müşteri yönetimi Kurumsal pakette kullanılabilir.{" "}
          <Link href="/settings/kurumsal" className="font-semibold text-emerald-700 underline underline-offset-4">
            Ayrıntılar ve paket yükseltme
          </Link>
        </Card>
      </div>
    );
  }
  const supabase = createSupabaseAdminClient();
  const [customers, priceLists] = await Promise.all([
    supabase ? getTenantDealerCustomers(supabase, tenant.id) : Promise.resolve([]),
    getTenantPriceLists(tenant.id),
  ]);
  return (
    <div className="space-y-6">
      {header}
      <DealerCustomersManager
        initialCustomers={customers}
        priceLists={priceLists}
        storefrontUrl={buildCatalogOrigin(tenant, process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ekatalox.com")}
      />
    </div>
  );
}
