import { notFound, redirect } from "next/navigation";
import { DealerCustomerDetail } from "@/components/dashboard/dealer-customer-detail";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantPriceLists } from "@/lib/data";
import { getDealerCustomerDetail } from "@/lib/kurumsal/dealer-customers";
import { buildCatalogOrigin, hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Müşteri Detayı" };

export const dynamic = "force-dynamic";

// Toptancı bayi müşterisi sayfası (kişiye özel şifre, 0138). Market'in
// müşteri defteri bu rotayı kullanmaz.
export default async function DealerCustomerPage(props: PageProps<"/dashboard/customers/[id]">) {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  if (tenant.business_type === "market" || !hasKurumsalSiteAccess(tenant)) redirect("/dashboard/customers");

  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = createSupabaseAdminClient();
  if (!supabase) notFound();

  const [detail, priceLists] = await Promise.all([
    getDealerCustomerDetail(supabase, tenant.id, id),
    getTenantPriceLists(tenant.id),
  ]);
  if (!detail) notFound();

  return (
    <DealerCustomerDetail
      key={detail.customer.id}
      initialCustomer={detail.customer}
      orders={detail.orders}
      priceLists={priceLists}
      storefrontUrl={buildCatalogOrigin(tenant, process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ekatalox.com")}
    />
  );
}
