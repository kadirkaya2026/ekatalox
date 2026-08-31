import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, OrderStatusEvent, StorefrontOrder } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/orders/status";

// Sipariş listesi/detayı — bayi paneli. Tüm sorgular tenant_id ile sınırlı;
// tarih aralığı Europe/Istanbul takvim günü olarak yorumlanır.

const ORDER_SELECT = "*";

// Siparişin geldiği magnetin kodu + tanımlı müşterisi. Sipariş magnet
// sahibinden FARKLI bir müşteriye aitse magnet_mismatch=true — bayi
// "magnet yabancı elde olabilir" uyarısını görür, teyit edip magneti
// pasife alabilir (bkz. kullanıcı kararı, 31 Ağu 2026).
async function attachMagnetInfo(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  orders: StorefrontOrder[],
): Promise<StorefrontOrder[]> {
  const magnetIds = [...new Set(orders.map((o) => o.magnet_code_id).filter(Boolean))] as string[];
  if (!magnetIds.length) return orders;

  const { data } = await supabase
    .from("magnet_codes")
    .select("id, code, customer_id, customers(full_name)")
    .eq("tenant_id", tenantId)
    .in("id", magnetIds);

  const byId = new Map((data ?? []).map((row) => [row.id as string, row]));

  return orders.map((order) => {
    const magnet = order.magnet_code_id ? byId.get(order.magnet_code_id) : undefined;
    if (!magnet) return order;
    const owner = magnet.customers as unknown as { full_name: string } | null;
    return {
      ...order,
      magnet_code: (magnet.code as string) ?? null,
      magnet_owner_name: owner?.full_name ?? null,
      magnet_mismatch: Boolean(
        magnet.customer_id && order.customer_id && magnet.customer_id !== order.customer_id,
      ),
    };
  });
}

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
    orders: await attachMagnetInfo(supabase, tenantId, (listResult.data ?? []) as StorefrontOrder[]),
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
  const [enriched] = await attachMagnetInfo(supabase, tenantId, [order as StorefrontOrder]);
  return { order: enriched, events: (events ?? []) as OrderStatusEvent[] };
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
