"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Gift, X } from "lucide-react";
import type { StorefrontCoupon } from "@/lib/types";
import { describeCoupon, formatCouponBenefit } from "@/lib/coupons/shared";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import type { CampaignDiscountStatus } from "@/lib/storefront/cart";
import { getCampaignDiscountAmount, getCampaignEligibleSubtotal } from "@/lib/storefront/cart";
import { buildCampaignRuleSentence } from "@/lib/validators/campaign";
import type { CartItem, TenantCampaign } from "@/lib/types";
import type { CurrencyCode } from "@/lib/products/constants";
import { cn, formatCurrency } from "@/lib/utils";

// Alt navigasyondaki (mobil) ve üst başlıktaki (masaüstü) "Kampanyalar"
// butonunun hedefi. StorefrontCategoryDrawer ile aynı tema token'larını
// kullanıyor: mobilde alttan sheet, lg: kırılımında sağdan çekmece.
//
// Kartlar iki türlü: rule_type "none" olanlar sadece anlatır,
// "cart_threshold" olanlar sepeti gerçekten indirir. İndirim matematiği
// burada değil — lib/storefront/cart.ts içinde; sepet, alt bar ve
// WhatsApp mesajı da aynı kaynaktan besleniyor.
export function StorefrontCampaignsSheet({
  isOpen,
  onClose,
  campaigns,
  campaignStatus,
  cartItems,
  excludedByCampaign,
  categoryNameById,
  currency,
  onOpenCategory,
  paymentCampaignBars,
  personalCoupon = null,
  personalCouponStatus = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  campaigns: TenantCampaign[];
  campaignStatus: CampaignDiscountStatus | null;
  cartItems: CartItem[];
  /** kampanya id -> hariç kategori id kümesi (alt kategoriler genişletilmiş) */
  excludedByCampaign?: Map<string, Set<string>>;
  categoryNameById: Map<string, string>;
  currency: CurrencyCode;
  onOpenCategory: (categoryId: string) => void;
  /** Ayarlardaki eski nakit/kart kampanya barları — varsa altta gösterilir */
  paymentCampaignBars?: ReactNode;
  /** Müşteriye özel kupon (telefona bağlı) — en üstte, ayrı kart */
  personalCoupon?: StorefrontCoupon | null;
  personalCouponStatus?: { applied: number; missing: number } | null;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const appliedId = campaignStatus?.applied?.campaign.id ?? null;
  // Kişiye özel kupon kartı: başlık tek satır ("Size Özel ₺100 İndirim!"),
  // dokununca detaylar (kapsam, minimum, son gün, mesaj, sepet durumu) açılır.
  const [couponOpen, setCouponOpen] = useState(false);
  useEffect(() => {
    if (!isOpen) setCouponOpen(false);
  }, [isOpen]);
  const hasContent = campaigns.length > 0 || Boolean(paymentCampaignBars) || Boolean(personalCoupon);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={theme.cartDrawerOverlay}
        >
          <button
            type="button"
            aria-label={t("campaignsSheet.closeAria")}
            className="absolute inset-0 h-full w-full"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={theme.cartDrawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label={t("campaignsSheet.title")}
          >
            <div className="flex max-h-[94dvh] flex-col lg:h-full lg:max-h-none">
              <div className="flex justify-center pt-3 lg:hidden">
                <span className={theme.cartDrawerHandle} />
              </div>

              <div className={cn(theme.cartDrawerHeaderBorder, "px-4 pb-3 pt-3 sm:px-5")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className={theme.cartDrawerTitle}>{t("campaignsSheet.title")}</h2>
                    <p
                      className={cn(
                        "truncate text-xs font-medium sm:text-sm",
                        theme.cartDrawerMuted,
                      )}
                    >
                      {t("campaignsSheet.description")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className={theme.cartDrawerCloseButton}
                    aria-label={t("campaignsSheet.closeAria")}
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="safe-bottom-padding max-h-[min(72dvh,560px)] space-y-3 overflow-y-auto px-4 py-4 sm:px-5 lg:max-h-none lg:flex-1">
                {personalCoupon ? (
                  <div className={cn("overflow-hidden rounded-2xl border", theme.border, theme.surface)}>
                    <button
                      type="button"
                      onClick={() => setCouponOpen((v) => !v)}
                      aria-expanded={couponOpen}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                        <Gift className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-lg font-bold", theme.text)}>
                          {t("coupon.cardTitle", { benefit: formatCouponBenefit(personalCoupon) })}
                        </span>
                        {personalCouponStatus?.applied ? (
                          <span className="block text-xs font-medium text-emerald-500">
                            ✓ {t("coupon.appliedInCart")}: -{formatCurrency(personalCouponStatus.applied, currency)}
                          </span>
                        ) : (
                          <span className={cn("block text-xs", theme.textMuted)}>{t("coupon.tapForDetails")}</span>
                        )}
                      </span>
                      <ChevronDown className={cn("size-5 shrink-0 transition-transform", theme.textMuted, couponOpen && "rotate-180")} />
                    </button>
                    {couponOpen ? (
                      <div className={cn("border-t px-4 pb-4 pt-3 text-sm", theme.border)}>
                        <p className={theme.text}>{describeCoupon(personalCoupon)}</p>
                        {personalCoupon.message ? <p className={cn("mt-2", theme.textMuted)}>“{personalCoupon.message}”</p> : null}
                        <p className={cn("mt-2 text-xs font-medium", personalCouponStatus?.applied ? "text-emerald-500" : theme.textMuted)}>
                          {personalCouponStatus?.applied
                            ? `✓ ${t("coupon.appliedInCart")}: -${formatCurrency(personalCouponStatus.applied, currency)}`
                            : personalCouponStatus?.missing
                              ? t(personalCoupon.category_names?.length ? "coupon.addMoreCategory" : "coupon.addMore", {
                                  amount: formatCurrency(personalCouponStatus.missing, currency),
                                  benefit: formatCouponBenefit(personalCoupon),
                                  category: personalCoupon.category_names?.join(", ") ?? "",
                                })
                              : t("coupon.autoApply")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    isApplied={campaign.id === appliedId}
                    cartItems={cartItems}
                    excludedByCampaign={excludedByCampaign}
                    categoryNameById={categoryNameById}
                    currency={currency}
                    onOpenCategory={(categoryId) => {
                      onOpenCategory(categoryId);
                      onClose();
                    }}
                  />
                ))}

                {paymentCampaignBars}

                {hasContent ? null : (
                  <div className="py-8 text-center">
                    <p className={cn("text-sm font-semibold", theme.text)}>
                      {t("campaignsSheet.empty")}
                    </p>
                    <p className={cn("mt-1.5 text-xs", theme.textMuted)}>
                      {t("campaignsSheet.emptyHint")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CampaignCard({
  campaign,
  isApplied,
  cartItems,
  excludedByCampaign,
  categoryNameById,
  currency,
  onOpenCategory,
}: {
  campaign: TenantCampaign;
  isApplied: boolean;
  cartItems: CartItem[];
  excludedByCampaign?: Map<string, Set<string>>;
  categoryNameById: Map<string, string>;
  currency: CurrencyCode;
  onOpenCategory: (categoryId: string) => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  const ruleSentence = buildCampaignRuleSentence({
    minCartAmount: campaign.min_cart_amount,
    discountKind: campaign.discount_kind,
    discountValue: campaign.discount_value,
    paymentMethod: campaign.payment_method,
    formatAmount: (value) => formatCurrency(value, currency),
    labels: {
      template: (threshold, benefit) =>
        t("campaignsSheet.ruleTemplate", { threshold, benefit }),
      cashOnly: t("campaignsSheet.cashOnly"),
      cardOnly: t("campaignsSheet.cardOnly"),
    },
  });

  const hasRule = campaign.rule_type === "cart_threshold" && campaign.min_cart_amount !== null;
  // Hariç tutulan kategoriler eşiğe sayılmadığı için "kalan tutar" sepet
  // toplamına göre değil, kampanyaya UYGUN tutara göre hesaplanmalı.
  const uygunTutar = getCampaignEligibleSubtotal(cartItems, campaign, excludedByCampaign);
  const remaining = hasRule ? campaign.min_cart_amount! - uygunTutar : 0;
  // Eşik tuttu ama uygulanmıyorsa sebep ödeme yöntemi şartıdır — ayırmak
  // için tutarı doğrudan soruyoruz.
  const qualifiesByAmount =
    hasRule && getCampaignDiscountAmount(campaign, cartItems, excludedByCampaign) > 0;

  // Hariç kategoriler müşteriye açıkça yazılmalı, yoksa "neden tutmadı"
  // sorusu doğuyor. Sadece bayinin seçtikleri gösteriliyor (alt kategoriler
  // genişletilmiş hâli değil) — liste okunabilir kalsın.
  const haricKategoriAdlari = (campaign.excluded_category_ids ?? [])
    .map((id) => categoryNameById.get(id))
    .filter((ad): ad is string => Boolean(ad));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.55rem]",
        theme.elevation1,
        theme.surfaceRing,
        theme.border,
        theme.surface,
      )}
    >
      {campaign.image_url ? (
        <div className="relative aspect-[16/9] w-full">
          <StorefrontImage
            src={campaign.image_url}
            alt={campaign.title}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 420px"
          />
          {campaign.badge_label ? (
            <span
              className={cn(
                "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold",
                theme.activeTileBg,
                theme.activeTileText,
              )}
            >
              {campaign.badge_label}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 p-4">
        {!campaign.image_url && campaign.badge_label ? (
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-[11px] font-bold",
              theme.activeTileBg,
              theme.activeTileText,
            )}
          >
            {campaign.badge_label}
          </span>
        ) : null}

        <p className={cn("text-base font-bold leading-6 tracking-tight", theme.text)}>
          {campaign.title}
        </p>

        {campaign.description ? (
          <p className={cn("text-sm leading-5", theme.textMuted)}>{campaign.description}</p>
        ) : null}

        {ruleSentence ? (
          <p className={cn("text-sm font-semibold leading-5", theme.productPrice)}>
            {ruleSentence}
          </p>
        ) : null}

        {haricKategoriAdlari.length ? (
          <p className={cn("text-xs leading-4", theme.textMuted)}>
            {t("campaignsSheet.excluded", { categories: haricKategoriAdlari.join(", ") })}
          </p>
        ) : null}

        {isApplied ? (
          <p
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
              theme.campaignBarQualified,
              theme.campaignLabelQualified,
            )}
          >
            <Check className="size-3.5" />
            {t("campaignsSheet.applied")}
          </p>
        ) : hasRule && !qualifiesByAmount && remaining > 0 ? (
          <p className={cn("text-xs font-semibold", theme.textMuted)}>
            {t("campaignsSheet.remaining", {
              amount: formatCurrency(remaining, currency),
            })}
          </p>
        ) : hasRule && qualifiesByAmount && campaign.payment_method !== "any" ? (
          // Eşik tuttu, uygulanmadı, sebebi ödeme yöntemi şartı.
          <p className={cn("text-xs font-semibold", theme.textMuted)}>
            {campaign.payment_method === "cash"
              ? t("campaignsSheet.needsCash")
              : t("campaignsSheet.needsCard")}
          </p>
        ) : hasRule && qualifiesByAmount ? (
          // Eşik tuttu, ödeme şartı da yok -> uygulanmama sebebi başka bir
          // kampanyanın daha avantajlı olması (indirimler toplanmıyor).
          <p className={cn("text-xs font-semibold", theme.textMuted)}>
            {t("campaignsSheet.betterApplied")}
          </p>
        ) : null}

        {campaign.ends_at ? (
          <p className={cn("text-[11px]", theme.textTertiary)}>
            {t("campaignsSheet.endsAt", {
              date: new Date(campaign.ends_at).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
              }),
            })}
          </p>
        ) : null}

        {campaign.link_category_id ? (
          <button
            type="button"
            onClick={() => onOpenCategory(campaign.link_category_id!)}
            className={cn(
              theme.primaryButton,
              "mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-sm",
            )}
          >
            {t("campaignsSheet.seeProducts")}
            <ArrowRight className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
