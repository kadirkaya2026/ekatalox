import type { StorefrontCoupon } from "@/lib/types";

// Kupon indirimi: sepet ara toplamı (kampanya/nakit indirimi öncesi) minimum
// şartı sağlıyorsa uygulanır. Yüzde → ara toplam üzerinden; tutar → sabit,
// ara toplamı aşamaz. İstemci ve sunucu aynı fonksiyonu kullanır.
export function computeCouponDiscount(
  coupon: StorefrontCoupon | null | undefined,
  subtotal: number,
  currency: string,
): { amount: number; eligible: boolean; missing: number } {
  if (!coupon) return { amount: 0, eligible: false, missing: 0 };
  if (coupon.currency !== currency) return { amount: 0, eligible: false, missing: 0 };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { amount: 0, eligible: false, missing: 0 };
  }
  const min = coupon.min_order_amount ?? 0;
  if (subtotal < min) return { amount: 0, eligible: false, missing: Math.round((min - subtotal) * 100) / 100 };
  const raw = coupon.kind === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  const amount = Math.round(Math.min(Math.max(raw, 0), subtotal) * 100) / 100;
  return { amount, eligible: amount > 0, missing: 0 };
}

export function formatCouponBenefit(coupon: Pick<StorefrontCoupon, "kind" | "value" | "currency">) {
  if (coupon.kind === "percent") return `%${Number(coupon.value).toLocaleString("tr-TR")}`;
  const sym = coupon.currency === "TRY" ? "₺" : coupon.currency === "EUR" ? "€" : coupon.currency === "USD" ? "$" : coupon.currency;
  return `${sym}${Number(coupon.value).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function describeCoupon(coupon: StorefrontCoupon) {
  const parts = [`${formatCouponBenefit(coupon)} indirim`];
  if (coupon.min_order_amount && coupon.min_order_amount > 0) {
    parts.push(`${coupon.min_order_amount.toLocaleString("tr-TR")} ${coupon.currency === "TRY" ? "₺" : coupon.currency} ve üzeri siparişte`);
  }
  if (coupon.expires_at) {
    parts.push(`son gün ${new Date(coupon.expires_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`);
  }
  return parts.join(" · ");
}
