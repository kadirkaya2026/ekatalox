import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, StorefrontCustomerWithStats, StorefrontOrder } from "@/lib/types";

// Cari sayfası: müşteri başına sipariş özeti. Tenant'ın tüm siparişleri
// tek seferde çekilip JS'te toplanır (bir bayide birkaç bin sipariş; PostgREST
// toplama kapalı). Ciro = yalnız teslim edilen; bekleyen ayrı.
export async function getTenantCustomersOverview(
  tenantId: string,
): Promise<StorefrontCustomerWithStats[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const [{ data: customers }, { data: orders }, { data: magnets }, { data: blocked }] = await Promise.all([
    supabase.from("customers").select("*").eq("tenant_id", tenantId).order("last_order_at", { ascending: false }),
    supabase
      .from("orders")
      .select("customer_id, currency, total_amount, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase.from("magnet_codes").select("code, customer_id").eq("tenant_id", tenantId).not("customer_id", "is", null),
    supabase.from("blocked_customer_phones").select("id, phone").eq("tenant_id", tenantId),
  ]);

  const stats = new Map<
    string,
    {
      count: number;
      delivered: number;
      cancelled: number;
      totals: Record<string, number>;
      pending: Record<string, number>;
      lastStatus: OrderStatus | null;
    }
  >();

  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    const entry = stats.get(order.customer_id) ?? {
      count: 0,
      delivered: 0,
      cancelled: 0,
      totals: {},
      pending: {},
      lastStatus: null,
    };
    // orders created_at desc geldiği için ilk görülen = son sipariş
    if (entry.lastStatus === null) entry.lastStatus = (order.status ?? "delivered") as OrderStatus;
    entry.count += 1;
    const amount = Number(order.total_amount ?? 0);
    const status = (order.status ?? "delivered") as OrderStatus;
    if (order.currency !== "CATALOG") {
      if (status === "delivered") {
        entry.delivered += 1;
        entry.totals[order.currency] = (entry.totals[order.currency] ?? 0) + amount;
      } else if (status === "cancelled") {
        entry.cancelled += 1;
      } else {
        entry.pending[order.currency] = (entry.pending[order.currency] ?? 0) + amount;
      }
    } else if (status === "delivered") {
      entry.delivered += 1;
    } else if (status === "cancelled") {
      entry.cancelled += 1;
    }
    stats.set(order.customer_id, entry);
  }

  const magnetByCustomer = new Map<string, string>();
  for (const m of magnets ?? []) if (m.customer_id) magnetByCustomer.set(m.customer_id, m.code);
  const blockedByPhone = new Map<string, string>();
  for (const b of blocked ?? []) blockedByPhone.set(b.phone, b.id);

  return (customers ?? []).map((customer) => {
    const s = stats.get(customer.id);
    return {
      ...customer,
      orders_count: s?.count ?? 0,
      totals_by_currency: s?.totals ?? {},
      delivered_count: s?.delivered ?? 0,
      cancelled_count: s?.cancelled ?? 0,
      pending_by_currency: s?.pending ?? {},
      last_order_status: s?.lastStatus ?? null,
      magnet_code: magnetByCustomer.get(customer.id) ?? null,
      is_blocked: blockedByPhone.has(customer.phone),
      blocked_id: blockedByPhone.get(customer.phone) ?? null,
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
