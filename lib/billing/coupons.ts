// Paket kuponu doğrulama (signup_coupons tablosu, 0113). 29 Eyl 2026'dan beri
// toptancı paketleri (Başlangıç/Profesyonel/Kurumsal, yıllık) için geçerlidir:
// panelde paket talebinde /api/kupon/dogrula, süper admin paketi geçirirken
// /api/admin/tenants/[id] aynı fonksiyonu çağırır ki fiyatlar ayrışmasın.
import type { SupabaseClient } from "@supabase/supabase-js";
import { COUPON_PLAN_IDS } from "@/lib/admin/self-service";
import { formatTry, getToptanPlan } from "@/lib/billing/toptan-plans";

export type SignupCouponPlanId = (typeof COUPON_PLAN_IDS)[number];

export function isCouponPlanId(value: unknown): value is SignupCouponPlanId {
  return typeof value === "string" && (COUPON_PLAN_IDS as readonly string[]).includes(value);
}
export type SignupCouponDiscountType = "percent" | "amount";

export interface SignupCouponInfo {
  code: string;
  discountType: SignupCouponDiscountType;
  discountValue: number;
  description: string | null;
}

export type SignupCouponValidation =
  | {
      ok: true;
      coupon: SignupCouponInfo;
      listPrice: number;
      finalPrice: number;
      message: string;
    }
  | { ok: false; message: string };

interface SignupCouponRow {
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number | string;
  applies_to_plans: string[] | null;
  applies_to_periods: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function applyCouponDiscount(
  listPrice: number,
  discountType: SignupCouponDiscountType,
  discountValue: number,
) {
  if (discountType === "percent") {
    return Math.max(0, Math.round(listPrice - (listPrice * discountValue) / 100));
  }
  return Math.max(0, Math.round(listPrice - discountValue));
}

export function formatCouponMessage(coupon: SignupCouponInfo, listPrice: number, finalPrice: number) {
  const discountLabel =
    coupon.discountType === "percent"
      ? `%${coupon.discountValue} indirim`
      : `${formatTry(coupon.discountValue)} indirim`;
  return `${coupon.code} kuponu uygulandı: ${discountLabel}. ${formatTry(listPrice)} yerine ${formatTry(finalPrice)}.`;
}

export async function validateSignupCoupon(
  supabase: SupabaseClient,
  code: string,
  planId: SignupCouponPlanId,
): Promise<SignupCouponValidation> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { ok: false, message: "Kupon kodu girin." };
  }

  const plan = getToptanPlan(planId);
  if (!plan || plan.yearlyPrice <= 0) {
    return { ok: false, message: "Geçersiz paket." };
  }

  const { data, error } = await supabase
    .from("signup_coupons")
    .select(
      "code, description, discount_type, discount_value, applies_to_plans, applies_to_periods, valid_from, valid_until, max_uses, used_count, is_active",
    )
    .ilike("code", normalized)
    .maybeSingle();

  if (error) {
    console.error("[coupons] signup_coupons okunamadı:", error.message);
    return { ok: false, message: "Kupon şu anda doğrulanamıyor. Lütfen tekrar deneyin." };
  }

  const row = data as SignupCouponRow | null;
  if (!row || !row.is_active) {
    return { ok: false, message: "Kupon kodu bulunamadı." };
  }

  const now = Date.now();
  if (row.valid_from && new Date(row.valid_from).getTime() > now) {
    return { ok: false, message: "Bu kupon henüz başlamamış." };
  }
  if (row.valid_until && new Date(row.valid_until).getTime() <= now) {
    return { ok: false, message: "Bu kuponun süresi dolmuş." };
  }
  if (row.max_uses !== null && row.used_count >= row.max_uses) {
    return { ok: false, message: "Bu kuponun kullanım limiti dolmuş." };
  }
  if (row.applies_to_plans && row.applies_to_plans.length > 0 && !row.applies_to_plans.includes(planId)) {
    return { ok: false, message: "Bu kupon seçtiğiniz pakette geçerli değil." };
  }
  if (
    row.applies_to_periods &&
    row.applies_to_periods.length > 0 &&
    !row.applies_to_periods.includes("yearly")
  ) {
    return { ok: false, message: "Bu kupon seçtiğiniz ödeme döneminde geçerli değil." };
  }

  const discountType: SignupCouponDiscountType =
    row.discount_type === "amount" ? "amount" : "percent";
  const discountValue = Number(row.discount_value);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, message: "Kupon kodu bulunamadı." };
  }

  const listPrice = plan.yearlyPrice;
  const finalPrice = applyCouponDiscount(listPrice, discountType, discountValue);
  const coupon: SignupCouponInfo = {
    code: row.code,
    discountType,
    discountValue,
    description: row.description ?? null,
  };

  return {
    ok: true,
    coupon,
    listPrice,
    finalPrice,
    message: formatCouponMessage(coupon, listPrice, finalPrice),
  };
}
