import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StorefrontCustomerWithStats, StorefrontOrder } from "@/lib/types";

export async function getTenantCustomersOverview(
  tenantId: string,
): Promise<StorefrontCustomerWithStats[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("last_order_at", { ascending: false }),
    supabase.from("orders").select("customer_id, currency, total_amount").eq("tenant_id", tenantId),
  ]);

  const statsByCustomer = new Map<string, { count: number; totals: Record<string, number> }>();

  for (const order of orders ?? []) {
    if (!order.customer_id) {
      continue;
    }

    const entry = statsByCustomer.get(order.customer_id) ?? { count: 0, totals: {} };
    entry.count += 1;
    entry.totals[order.currency] = (entry.totals[order.currency] ?? 0) + Number(order.total_amount ?? 0);
    statsByCustomer.set(order.customer_id, entry);
  }

  return (customers ?? []).map((customer) => {
    const stats = statsByCustomer.get(customer.id) ?? { count: 0, totals: {} };
    return {
      ...customer,
      orders_count: stats.count,
      totals_by_currency: stats.totals,
    } satisfies StorefrontCustomerWithStats;
  });
}

export async function getTenantCustomerOrders(
  tenantId: string,
  customerId: string,
): Promise<StorefrontOrder[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return (data as StorefrontOrder[] | null) ?? [];
}
