import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enumerateBuckets } from "@/lib/dates/istanbul";
import type { SalesBucket, SalesPreset } from "@/lib/sales/presets";
import type { SalesCurrencyReport, SalesReport, SalesSeriesPoint, SalesTopProduct } from "@/lib/sales/types";
import type { OrderStatus } from "@/lib/types";

// Rapor verisi: PostgREST'te toplama kapalı olduğu için üç RPC (0092) +
// küçük bir head-count; JS'te yalnız türetilmiş oranlar ve boş dönem dolgusu.

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;
const round2 = (v: number) => Math.round(v * 100) / 100;

export async function getSalesReport(
  tenantId: string,
  params: { from: string; to: string; bucket: SalesBucket; preset?: SalesPreset },
): Promise<SalesReport> {
  const empty: SalesReport = {
    range: { from: params.from, to: params.to, bucket: params.bucket, preset: params.preset },
    currencies: [],
    catalogOrderCount: 0,
    costMissingProductCount: 0,
    generatedAt: new Date().toISOString(),
  };
  const supabase = createSupabaseAdminClient();
  if (!supabase) return empty;

  const base = { p_tenant_id: tenantId, p_from: params.from, p_to: params.to };
  const [kpis, series, top, missing] = await Promise.all([
    supabase.rpc("get_sales_kpis", base),
    supabase.rpc("get_sales_report", { ...base, p_bucket: params.bucket }),
    supabase.rpc("get_sales_top_products", { ...base, p_limit: 20 }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("purchase_price", null),
  ]);

  for (const r of [kpis, series, top]) {
    if (r.error) {
      console.error("[sales] rpc failed:", r.error);
    }
  }

  const kpiRows = (kpis.data ?? []) as Array<Record<string, unknown>>;
  const seriesRows = (series.data ?? []) as Array<Record<string, unknown>>;
  const topRows = (top.data ?? []) as Array<Record<string, unknown>>;
  const bucketStarts = enumerateBuckets(params.from, params.to, params.bucket);

  const catalogOrderCount = num(kpiRows.find((r) => r.currency === "CATALOG")?.total_count);

  const currencies: SalesCurrencyReport[] = kpiRows
    .filter((r) => r.currency !== "CATALOG")
    .map((r) => {
      const currency = String(r.currency);
      const revenue = round2(num(r.delivered_revenue));
      const cost = round2(num(r.delivered_cost));
      const costMissingOrders = num(r.delivered_cost_missing_orders);
      const deliveredCount = num(r.delivered_count);
      const totalCount = num(r.total_count);
      const cancelledCount = num(r.cancelled_count);
      // Maliyeti eksik siparişler kâr hesabından tamamen dışarıda tutulur;
      // "revenue - cost" yalnız maliyeti tam olan siparişlerin cirosuyla
      // anlamlı. Bu yüzden kâr = (maliyeti tam siparişlerin cirosu) - maliyet.
      const seriesForCurrency = seriesRows.filter((s) => s.currency === currency);
      const profit = round2(seriesForCurrency.reduce((t, s) => t + num(s.profit), 0));
      const marginBase = round2(cost + profit);
      const byStatus: Record<OrderStatus, number> = {
        new: num(r.new_count),
        confirmed: num(r.confirmed_count),
        preparing: num(r.preparing_count),
        shipped: num(r.shipped_count),
        delivered: deliveredCount,
        cancelled: cancelledCount,
      };
      const cash = { count: num(r.cash_count), amount: round2(num(r.cash_amount)) };
      const card = { count: num(r.card_count), amount: round2(num(r.card_amount)) };

      const byBucket = new Map(seriesForCurrency.map((s) => [String(s.bucket_start), s]));
      const points: SalesSeriesPoint[] = bucketStarts.map((b) => {
        const s = byBucket.get(b);
        return {
          bucketStart: b,
          orderCount: num(s?.order_count),
          deliveredCount: num(s?.delivered_count),
          cancelledCount: num(s?.cancelled_count),
          pendingCount: num(s?.pending_count),
          revenue: round2(num(s?.revenue)),
          cost: round2(num(s?.cost)),
          profit: round2(num(s?.profit)),
          costMissingOrders: num(s?.cost_missing_orders),
          avgBasket: round2(num(s?.avg_basket)),
        };
      });

      const topProducts: SalesTopProduct[] = topRows
        .filter((t) => t.currency === currency)
        .map((t) => ({
          productKey: String(t.product_key ?? ""),
          productName: String(t.product_name ?? ""),
          skuCode: t.sku_code ? String(t.sku_code) : null,
          quantity: num(t.quantity),
          revenue: round2(num(t.revenue)),
          cost: t.cost === null || t.cost === undefined ? null : round2(num(t.cost)),
          profit: t.profit === null || t.profit === undefined ? null : round2(num(t.profit)),
          costMissing: Boolean(t.cost_missing),
          orderCount: num(t.order_count),
        }));

      return {
        currency,
        revenue,
        cost,
        profit,
        marginPct: marginBase > 0 ? round2((profit / marginBase) * 100) : null,
        deliveredCount,
        pendingCount: byStatus.new + byStatus.confirmed + byStatus.preparing + byStatus.shipped,
        pendingAmount: round2(num(r.pending_amount)),
        cancelledCount,
        totalCount,
        byStatus,
        avgBasket: deliveredCount > 0 ? round2(revenue / deliveredCount) : 0,
        cancelRatePct: totalCount > 0 ? round2((cancelledCount / totalCount) * 100) : null,
        costMissingOrders,
        payment: {
          cash,
          card,
          unknown: {
            count: Math.max(0, deliveredCount - cash.count - card.count),
            amount: round2(Math.max(0, revenue - cash.amount - card.amount)),
          },
        },
        series: points,
        topProducts,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    ...empty,
    currencies,
    catalogOrderCount,
    costMissingProductCount: missing.count ?? 0,
  };
}
