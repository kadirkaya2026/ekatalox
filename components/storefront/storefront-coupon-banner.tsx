"use client";

import { Gift, ChevronRight } from "lucide-react";
import type { StorefrontCoupon } from "@/lib/types";
import { describeCoupon, formatCouponBenefit } from "@/lib/coupons/shared";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";

// Vitrinin başlığı altında ince şerit: müşteriye özel kupon var. Sepete ürün
// eklendikçe indirim kendiliğinden düşer; tıklayınca Kampanyalar açılır.
export function StorefrontCouponBanner({ coupon, onOpenCampaigns }: { coupon: StorefrontCoupon; onOpenCampaigns: () => void }) {
  const { t } = useStorefrontLocale();
  return (
    <button
      type="button"
      onClick={onOpenCampaigns}
      className="flex w-full items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-left text-sm font-medium text-white transition hover:bg-emerald-700"
    >
      <Gift className="size-4 shrink-0" />
      <span className="truncate">
        {t("coupon.bannerPrefix")} <strong>{formatCouponBenefit(coupon)} {t("coupon.discount")}</strong> · {describeCoupon(coupon).split(" · ").slice(1).join(" · ") || t("coupon.autoApply")}
      </span>
      <ChevronRight className="size-4 shrink-0 opacity-80" />
    </button>
  );
}
