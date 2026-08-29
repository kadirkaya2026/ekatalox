import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorefrontCoupon } from "@/lib/types";

const COUPON_SELECT = "id, kind, value, min_order_amount, currency, title, message, expires_at, single_use, status";

// Telefona tanımlı, süresi geçmemiş, aktif kupon (en yenisi). Vitrin ve
// sipariş kaydı aynı fonksiyonu kullanır → istemci/sunucu tutarlı.
export async function findActiveCouponForPhone(
  supabase: SupabaseClient,
  tenantId: string,
  phone: string,
): Promise<StorefrontCoupon | null> {
  if (!phone) return null;
  const { data } = await supabase
    .from("customer_coupons")
    .select(COUPON_SELECT)
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    kind: data.kind,
    value: Number(data.value),
    min_order_amount: data.min_order_amount === null ? null : Number(data.min_order_amount),
    currency: data.currency,
    title: data.title,
    message: data.message ?? null,
    expires_at: data.expires_at ?? null,
  };
}
