import type { CartItem, StorefrontCoupon } from "@/lib/types";

function sym(currency: string) {
  return currency === "TRY" ? "₺" : currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
}

// Kupona sayılan tutar: kategori kapsamı varsa yalnız o kategorilerdeki
// (category_ids sunucuda alt kategorilerle genişletilmiş gelir) kalemler.
export function getCouponEligibleSubtotal(coupon: StorefrontCoupon, items: CartItem[]) {
  const scope = coupon.category_ids?.length ? new Set(coupon.category_ids) : null;
  const total = items.reduce((sum, item) => {
    if (scope && !(item.category_id && scope.has(item.category_id))) return sum;
    return sum + (item.price ?? 0) * item.quantity;
  }, 0);
  return Math.round(total * 100) / 100;
}

// Kupon indirimi. Yüzde → kapsamdaki tutar üzerinden; tutar → sabit, kapsamdaki
// tutarı aşamaz. Minimum şart da kapsamdaki tutara bakar. İstemci ve sunucu
// aynı fonksiyonu kullanır.
export function computeCouponDiscount(
  coupon: StorefrontCoupon | null | undefined,
  items: CartItem[],
  currency: string,
): { amount: number; eligible: boolean; missing: number; eligibleSubtotal: number } {
  if (!coupon) return { amount: 0, eligible: false, missing: 0, eligibleSubtotal: 0 };
  if (coupon.currency !== currency) return { amount: 0, eligible: false, missing: 0, eligibleSubtotal: 0 };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { amount: 0, eligible: false, missing: 0, eligibleSubtotal: 0 };
  }
  const eligibleSubtotal = getCouponEligibleSubtotal(coupon, items);
  const min = coupon.min_order_amount ?? 0;
  if (eligibleSubtotal <= 0 || eligibleSubtotal < min) {
    return { amount: 0, eligible: false, missing: Math.round(Math.max(min - eligibleSubtotal, 0) * 100) / 100, eligibleSubtotal };
  }
  const raw = coupon.kind === "percent" ? (eligibleSubtotal * coupon.value) / 100 : coupon.value;
  const amount = Math.round(Math.min(Math.max(raw, 0), eligibleSubtotal) * 100) / 100;
  return { amount, eligible: amount > 0, missing: 0, eligibleSubtotal };
}

export function formatCouponBenefit(coupon: Pick<StorefrontCoupon, "kind" | "value" | "currency">) {
  if (coupon.kind === "percent") return `%${Number(coupon.value).toLocaleString("tr-TR")}`;
  return `${sym(coupon.currency)}${Number(coupon.value).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatCouponScope(coupon: Pick<StorefrontCoupon, "category_names">) {
  const names = coupon.category_names ?? [];
  if (!names.length) return null;
  return names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
}

// "Atıştırmalık kategorisinde %10 indirim · 200 ₺ ve üzeri · son gün 5 Eylül"
export function describeCoupon(coupon: StorefrontCoupon) {
  const scope = formatCouponScope(coupon);
  const parts = [scope ? `${scope} kategorisinde ${formatCouponBenefit(coupon)} indirim` : `${formatCouponBenefit(coupon)} indirim`];
  if (coupon.min_order_amount && coupon.min_order_amount > 0) {
    parts.push(`${coupon.min_order_amount.toLocaleString("tr-TR")} ${sym(coupon.currency)} ve üzeri${scope ? " (bu kategorilerden)" : ""}`);
  }
  if (coupon.expires_at) {
    parts.push(`son gün ${new Date(coupon.expires_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`);
  }
  return parts.join(" · ");
}
