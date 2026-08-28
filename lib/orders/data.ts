import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, OrderStatusEvent, StorefrontOrder } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/orders/status";

// Sipariş listesi/detayı — bayi paneli. Tüm sorgular tenant_id ile sınırlı;
// tarih aralığı Europe/Istanbul takvim günü olarak yorumlanır.

const ORDER_SELECT = "*";

function istanbulDayStart(iso: string) {
  return `${iso}T00:00:00+03:00`;
}
function istanbulDayEnd(iso: string) {
  return `${iso}T23:59:59.999+03:00`;
}

export interface OrdersPage {
  orders: StorefrontOrder[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<OrderStatus | "all", number>;
}

export async function getTenantOrdersPage(
  tenantId: string,
  params: { status?: string; q?: string; from?: string; to?: string; page?: number; pageSize?: number },
): Promise<OrdersPage> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 25));
  const counts = Object.fromEntries([...ORDER_STATUSES, "all"].map((s) => [s, 0])) as OrdersPage["counts"];
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { orders: [], total: 0, page, pageSize, counts };

  const applyFilters = <T extends { eq: any; gte: any; lte: any; or: any }>(query: T) => {
    let q: any = query.eq("tenant_id", tenantId);
    if (params.from) q = q.gte("created_at", istanbulDayStart(params.from));
    if (params.to) q = q.lte("created_at", istanbulDayEnd(params.to));
    if (params.q) {
      const needle = params.q.replace(/[%,()]/g, " ").trim();
      if (needle) {
        q = q.or(
          `order_number.ilike.%${needle}%,customer_name.ilike.%${needle}%,customer_phone.ilike.%${needle}%`,
        );
      }
    }
    return q;
  };

  const from = (page - 1) * pageSize;
  let listQuery = applyFilters(supabase.from("orders").select(ORDER_SELECT, { count: "exact" }));
  if (params.status && params.status !== "all") listQuery = listQuery.eq("status", params.status);
  listQuery = listQuery.order("created_at", { ascending: false }).range(from, from + pageSize - 1);

  // Durum rozetleri: aynı süzgeçle (durum hariç) her durumun adedi.
  const countQueries = ORDER_STATUSES.map((status) =>
    applyFilters(supabase.from("orders").select("id", { count: "exact", head: true })).eq("status", status),
  );

  const [listResult, ...countResults] = await Promise.all([listQuery, ...countQueries]);
  ORDER_STATUSES.forEach((status, i) => {
    counts[status] = countResults[i]?.count ?? 0;
  });
  counts.all = ORDER_STATUSES.reduce((t, s) => t + counts[s], 0);

  return {
    orders: (listResult.data ?? []) as StorefrontOrder[],
    total: listResult.count ?? 0,
    page,
    pageSize,
    counts,
  };
}

export async function getTenantOrderWithEvents(tenantId: string, orderId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const [{ data: order }, { data: events }] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).eq("tenant_id", tenantId).eq("id", orderId).maybeSingle(),
    supabase
      .from("order_status_events")
      .select("id, order_id, from_status, to_status, reason, actor, created_at")
      .eq("tenant_id", tenantId)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);
  if (!order) return null;
  return { order: order as StorefrontOrder, events: (events ?? []) as OrderStatusEvent[] };
}

/** Kenar çubuğu rozeti: bayinin henüz bakmadığı ("Yeni") siparişler. */
export async function getTenantNewOrderCount(tenantId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "new");
  return count ?? 0;
}

/** Müşteri takip sayfası: token → sipariş (tenant kontrolü çağıranda). */
export async function getOrderByTrackingToken(token: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data: order } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("tracking_token", token)
    .maybeSingle();
  if (!order) return null;
  const { data: events } = await supabase
    .from("order_status_events")
    .select("id, order_id, from_status, to_status, reason, actor, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });
  return { order: order as StorefrontOrder, events: (events ?? []) as OrderStatusEvent[] };
}
