"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Gift, Megaphone } from "lucide-react";
import type { StorefrontCoupon, TenantCampaign } from "@/lib/types";
import { describeCoupon, formatCouponBenefit } from "@/lib/coupons/shared";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";

const ROTATE_MS = 3000;

// Başlık altındaki yeşil şerit: kişiye özel kupon + genel kampanyalar sırayla
// döner (3 sn); tek içerik varsa sabit durur. Tıklayınca Kampanyalar açılır.
export function StorefrontCouponBanner({
  coupon,
  campaigns = [],
  onOpenCampaigns,
}: {
  coupon: StorefrontCoupon | null;
  campaigns?: TenantCampaign[];
  onOpenCampaigns: () => void;
}) {
  const { t } = useStorefrontLocale();

  const slides: Array<{ key: string; icon: "gift" | "megaphone"; text: React.ReactNode }> = [];
  if (coupon) {
    slides.push({
      key: `coupon-${coupon.id}`,
      icon: "gift",
      text: (
        <>
          {t("coupon.bannerPrefix")} <strong>{formatCouponBenefit(coupon)} {t("coupon.discount")}</strong> ·{" "}
          {describeCoupon(coupon).split(" · ").slice(1).join(" · ") || t("coupon.autoApply")}
        </>
      ),
    });
  }
  for (const campaign of campaigns) {
    slides.push({ key: `campaign-${campaign.id}`, icon: "megaphone", text: <strong>{campaign.title}</strong> });
  }

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[index % slides.length];
  const Icon = slide.icon === "gift" ? Gift : Megaphone;

  return (
    <button
      type="button"
      onClick={onOpenCampaigns}
      className="flex w-full items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-left text-sm font-medium text-white transition hover:bg-emerald-700"
    >
      <style>{`@keyframes ekxBannerFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
      <span key={slide.key} className="flex min-w-0 items-center gap-2" style={{ animation: "ekxBannerFade 0.35s ease-out" }}>
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{slide.text}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 opacity-80" />
    </button>
  );
}
