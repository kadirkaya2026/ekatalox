"use client";

import { useRef, useState, type Dispatch, ReactNode, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDiscountPercentage,
  updateCartLineQuantity,
  type CartDiscountSummary,
  type CartPaymentSummary,
} from "@/lib/storefront/cart";
import type {
  CartItem,
  InstallmentOption,
  StorefrontProduct,
  TenantStorefrontSettings,
} from "@/lib/types";
import { formatProductModelNo } from "@/lib/products/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import type { WhatsAppOrderHandoff } from "@/lib/storefront/whatsapp-order";
import { STOREFRONT_CART_THUMB_SIZES } from "@/lib/storefront/image-sizes";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";

export type StorefrontCartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  cartDistinctCount: number;
  cartItemCount: number;
  selectedPaymentMethod: "cash" | "card" | null;
  setSelectedPaymentMethod: Dispatch<SetStateAction<"cash" | "card" | null>>;
  selectedInstallmentCount: number | null;
  setSelectedInstallmentCount: Dispatch<SetStateAction<number | null>>;
  paymentMethodError: string | null;
  setPaymentMethodError: Dispatch<SetStateAction<string | null>>;
  storefrontSettings: TenantStorefrontSettings;
  note: string;
  setNote: Dispatch<SetStateAction<string>>;
  customerReferenceName: string;
  setCustomerReferenceName: Dispatch<SetStateAction<string>>;
  customerReferenceNameError: string | null;
  setCustomerReferenceNameError: Dispatch<SetStateAction<string | null>>;
  customerAddress: string;
  setCustomerAddress: Dispatch<SetStateAction<string>>;
  customerAddressError: string | null;
  setCustomerAddressError: Dispatch<SetStateAction<string | null>>;
  customerPhone: string;
  setCustomerPhone: Dispatch<SetStateAction<string>>;
  customerPhoneError: string | null;
  setCustomerPhoneError: Dispatch<SetStateAction<string | null>>;
  isMarketTenant: boolean;
  // Alkol/sigara bayii (tekel) — yasal olarak dağıtım/teslimat yapamaz.
  // true iken adres alanı hiç gösterilmez/toplanmaz (kullanıcı isteği,
  // 20 Ağu 2026).
  isTekel: boolean;
  recommendedProducts: StorefrontProduct[];
  cartPaymentSummary: CartPaymentSummary | null;
  cartDiscountSummary: CartDiscountSummary | null;
  cartTotalEntries: Array<{ currency: string; total: number }>;
  cartTotal: number;
  cartCurrency: string;
  isMinCartAmountMet: boolean;
  minCartAmountRemaining: number;
  onWhatsAppOrder: () => void | Promise<void>;
  isGeneratingOrderPdf: boolean;
  orderPdfError: string | null;
  whatsappHandoff: WhatsAppOrderHandoff | null;
  onClearWhatsappHandoff: () => void;
  cartStorageKey: string;
  stickyCartButtonClassName: string;
  isCashCampaignDismissedOnCart: boolean;
  isCardCampaignDismissedOnCart: boolean;
  onDismissCashCampaignOnCart: () => void;
  onDismissCardCampaignOnCart: () => void;
  renderCashDiscountBar: (compact: boolean, onDismiss?: () => void) => ReactNode;
  renderCardCampaignBar: (compact: boolean, onDismiss?: () => void) => ReactNode;
  renderCrossSellCard: (product: StorefrontProduct) => ReactNode;
  isCatalogOnly?: boolean;
};

export function StorefrontCartDrawer({
  isOpen,
  onClose,
  cart,
  setCart,
  cartDistinctCount,
  cartItemCount,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  selectedInstallmentCount,
  setSelectedInstallmentCount,
  paymentMethodError,
  setPaymentMethodError,
  storefrontSettings,
  note,
  setNote,
  customerReferenceName,
  setCustomerReferenceName,
  customerReferenceNameError,
  setCustomerReferenceNameError,
  customerAddress,
  setCustomerAddress,
  customerAddressError,
  setCustomerAddressError,
  customerPhone,
  setCustomerPhone,
  customerPhoneError,
  setCustomerPhoneError,
  isMarketTenant,
  isTekel,
  recommendedProducts,
  cartPaymentSummary,
  cartDiscountSummary,
  cartTotalEntries,
  cartTotal,
  cartCurrency,
  isMinCartAmountMet,
  minCartAmountRemaining,
  onWhatsAppOrder,
  isGeneratingOrderPdf,
  orderPdfError,
  whatsappHandoff,
  onClearWhatsappHandoff,
  cartStorageKey,
  stickyCartButtonClassName,
  isCashCampaignDismissedOnCart,
  isCardCampaignDismissedOnCart,
  onDismissCashCampaignOnCart,
  onDismissCardCampaignOnCart,
  renderCashDiscountBar,
  renderCardCampaignBar,
  renderCrossSellCard,
  isCatalogOnly = false,
}: StorefrontCartDrawerProps) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const crossSellScrollRef = useRef<HTMLDivElement>(null);

  function scrollCrossSell(direction: "left" | "right") {
    const container = crossSellScrollRef.current;
    if (!container) return;
    const amount = Math.round(container.clientWidth * 0.8) * (direction === "left" ? -1 : 1);
    container.scrollBy({ left: amount, behavior: "smooth" });
  }

  function updateCartItemQuantity(productId: string, value: string) {
    if (value === "") {
      // Boş input — henüz silme, kullanıcı tamamlayamamış bir sayı girebilir
      return;
    }

    const quantity = Number.parseInt(value, 10);

    if (!Number.isFinite(quantity) || quantity < 0) {
      // Negatif veya geçersiz değer — sil
      setCart((current) => updateCartLineQuantity(current, productId, 0));
      return;
    }

    if (quantity === 0) {
      // Kullanıcı açıkça 0 yazdı — ürünü sepetten kaldır
      setCart((current) => updateCartLineQuantity(current, productId, 0));
      return;
    }

    setCart((current) => updateCartLineQuantity(current, productId, quantity));
  }

  function clearCart() {
    setCart([]);
    setSelectedPaymentMethod(null);
    setSelectedInstallmentCount(null);
    setPaymentMethodError(null);
    onClearWhatsappHandoff();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(cartStorageKey);
    }
  }

  async function copyOrderMessage() {
    if (!whatsappHandoff) {
      return;
    }

    try {
      await navigator.clipboard.writeText(whatsappHandoff.message);
      setCopyFeedback(t("cart.messageCopied"));
    } catch {
      setCopyFeedback(t("cart.messageCopyFailed"));
    }
  }

  async function handleWhatsAppOrder() {
    if (!cart.length || !isMinCartAmountMet) return;
    setCopyFeedback(null);

    await onWhatsAppOrder();
  }

  const canCompleteWhatsAppOrder =
    cart.length > 0 && !isGeneratingOrderPdf && isMinCartAmountMet;

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
            aria-label={t("cart.closeAria")}
            className="absolute inset-0 h-full w-full"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={theme.cartDrawerPanel}
          >
        <div className="flex h-full max-h-[94dvh] flex-col lg:max-h-none">
          <div className="flex justify-center pt-3 lg:hidden">
            <span className={theme.cartDrawerHandle} />
          </div>

          <div className={cn(theme.cartDrawerHeaderBorder, "px-4 pb-3 pt-3 sm:px-5 lg:px-6 lg:pb-4 lg:pt-5")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2.5">
                <h2 className={theme.cartDrawerTitle}>
                  {t(isTekel ? "cart.titlePickup" : "cart.title")}
                </h2>
                <p className={cn("truncate text-xs font-medium sm:text-sm", theme.cartDrawerMuted)}>
                  {t("cart.lineSummary", { distinct: cartDistinctCount, count: cartItemCount })}
                </p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className={theme.cartDrawerCloseButton}
                  aria-label={t("cart.closeAria")}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="safe-bottom-padding flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
            {cart.length ? (
              <div className="space-y-4">
                {selectedPaymentMethod === "cash"
                  ? !isCashCampaignDismissedOnCart &&
                    renderCashDiscountBar(false, onDismissCashCampaignOnCart)
                  : selectedPaymentMethod === "card"
                    ? !isCardCampaignDismissedOnCart &&
                      renderCardCampaignBar(false, onDismissCardCampaignOnCart)
                    : (
                      <>
                        {!isCashCampaignDismissedOnCart &&
                          renderCashDiscountBar(false, onDismissCashCampaignOnCart)}
                        {!isCardCampaignDismissedOnCart &&
                          renderCardCampaignBar(false, onDismissCardCampaignOnCart)}
                      </>
                    )}

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className={theme.cartDrawerItem}
                  >
                    <div className="flex gap-3">
                      <div className={cn("relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[1.15rem] sm:h-20 sm:w-20 sm:rounded-[1.35rem]", theme.border, theme.productThumbSurface)}>
                        {item.image_url ? (
                          <StorefrontImage
                            src={item.image_url}
                            alt={item.product_name}
                            className="object-contain p-2.5 sm:p-3"
                            sizes={STOREFRONT_CART_THUMB_SIZES}
                          />
                        ) : (
                          <div className={cn("flex h-full w-full items-center justify-center", theme.surfaceMuted)}>
                            <ProductImagePlaceholder
                              productName={item.product_name}
                              iconClassName={cn("size-4", theme.textMuted)}
                              textClassName={cn("text-[8px] leading-[10px]", theme.textMuted)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cn("line-clamp-2 text-sm font-semibold leading-5", theme.text)}>
                              {item.product_name}
                            </p>
                            {item.variant_name ? (
                              <p className="mt-0.5 text-xs font-medium text-emerald-700">
                                {t("cart.modelPrefix")} {item.variant_name}
                              </p>
                            ) : null}
                            {theme.showProductModelNo ? (
                              <p className={cn("mt-0.5 text-xs", theme.textMuted)}>
                                {formatProductModelNo(item.sku_code)}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) => updateCartLineQuantity(current, item.id, 0))
                            }
                            className={cn("h-fit rounded-full p-2 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50", theme.textMuted)}
                            aria-label={t("cart.removeItemAria")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex min-w-0 items-end justify-between gap-2 pt-3 sm:gap-3">
                      <div className={cn("flex shrink-0 items-center rounded-full p-0.5 shadow-sm sm:p-1", theme.quantityStepper)}>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((current) =>
                              updateCartLineQuantity(current, item.id, item.quantity - 1),
                            )
                          }
                          className={cn("flex size-8 items-center justify-center rounded-full transition sm:size-9", theme.quantityStepperButton)}
                          aria-label={t("cart.decreaseAria")}
                        >
                          <Minus className="size-4" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity}
                          onChange={(event) =>
                            updateCartItemQuantity(item.id, event.target.value)
                          }
                          className={cn(
                            "h-8 w-11 rounded-md bg-transparent py-0 text-center text-[16px] font-bold leading-none outline-none focus-visible:ring-2 focus-visible:ring-current/40 sm:h-9 sm:w-14",
                            theme.text,
                          )}
                          style={{ fontSize: "16px" }}
                          aria-label={t("cart.quantityAria")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCart((current) =>
                              updateCartLineQuantity(current, item.id, item.quantity + 1),
                            )
                          }
                          className={cn("flex size-8 items-center justify-center rounded-full transition sm:size-9", theme.quantityStepperButton)}
                          aria-label={t("cart.increaseAria")}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>

                      {!isCatalogOnly ? (
                        <div className="ml-auto flex min-w-0 max-w-[58%] flex-1 items-end justify-end gap-2 text-right sm:max-w-none sm:gap-4">
                          <div className="min-w-0 max-w-[48%] sm:max-w-none">
                            <p className={cn("truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.18em]", theme.textMuted)}>
                              {t("cart.unitPrice")}
                            </p>
                            <p className={cn("mt-1 truncate text-sm font-semibold tabular-nums", theme.textMuted)}>
                              {item.price !== null
                                ? formatCurrency(item.price, item.currency)
                                : "—"}
                            </p>
                          </div>
                          <div className="min-w-0 max-w-[52%] sm:max-w-none">
                            <p className={cn("truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.18em]", theme.textMuted)}>
                              {t("cart.subtotalLine")}
                            </p>
                            <p className={cn("mt-1 truncate text-sm font-bold tabular-nums tracking-tight sm:text-base", theme.text)}>
                              {item.price !== null
                                ? formatCurrency(item.price * item.quantity, item.currency)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                <div className={theme.panelSurface}>
                  {!isCatalogOnly ? (
                    <>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className={cn("text-sm font-semibold", theme.text)}>{t("cart.paymentMethod")}</p>
                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", theme.surfaceMuted, theme.textMuted)}>
                      {isMarketTenant ? t("cart.required") : t("cart.optional")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentMethod("cash");
                        setSelectedInstallmentCount(null);
                        setPaymentMethodError(null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition",
                        selectedPaymentMethod === "cash"
                          ? theme.cartPaymentCashActive
                          : theme.cartPaymentInactive,
                      )}
                    >
                      <Banknote className="size-4" />
                      {t("cart.cash")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentMethod("card");
                        setPaymentMethodError(null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition",
                        selectedPaymentMethod === "card"
                          ? theme.cartPaymentCardActive
                          : theme.cartPaymentInactive,
                      )}
                    >
                      <CreditCard className="size-4" />
                      {t("cart.card")}
                    </button>
                  </div>
                  {paymentMethodError ? (
                    <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{paymentMethodError}</p>
                  ) : null}
                    </>
                  ) : null}
                  {isMarketTenant ? (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className={cn("text-sm font-semibold", theme.text)}>{t("cart.customerPhone")}</span>
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", theme.surfaceMuted, theme.textMuted)}>
                          {t("cart.required")}
                        </span>
                      </div>
                      <Input
                        type="tel"
                        value={customerPhone}
                        onChange={(event) => {
                          setCustomerPhone(event.target.value);
                          setCustomerPhoneError(null);
                        }}
                        placeholder={t("cart.customerPhonePlaceholder")}
                        className={cn("rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
                      />
                      {customerPhoneError ? (
                        <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{customerPhoneError}</p>
                      ) : null}
                      <p className={cn("mt-2 text-xs", theme.textMuted)}>{t("cart.customerPhoneAutofillHint")}</p>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className={cn("text-sm font-semibold", theme.text)}>{t("cart.customerReferenceName")}</span>
                      <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", theme.surfaceMuted, theme.textMuted)}>
                        {isMarketTenant ? t("cart.required") : t("cart.optional")}
                      </span>
                    </div>
                    <Input
                      value={customerReferenceName}
                      onChange={(event) => {
                        setCustomerReferenceName(event.target.value);
                        setCustomerReferenceNameError(null);
                      }}
                      placeholder={t("cart.customerReferenceNamePlaceholder")}
                      className={cn("rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
                    />
                    {customerReferenceNameError ? (
                      <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{customerReferenceNameError}</p>
                    ) : null}
                  </div>

                  {isMarketTenant && !isTekel ? (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className={cn("text-sm font-semibold", theme.text)}>{t("cart.customerAddress")}</span>
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", theme.surfaceMuted, theme.textMuted)}>
                          {t("cart.required")}
                        </span>
                      </div>
                      <Textarea
                        value={customerAddress}
                        onChange={(event) => {
                          setCustomerAddress(event.target.value);
                          setCustomerAddressError(null);
                        }}
                        placeholder={t("cart.customerAddressPlaceholder")}
                        className={cn("rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
                      />
                      {customerAddressError ? (
                        <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{customerAddressError}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {isMarketTenant && isTekel ? (
                    <p className={cn("mt-3 rounded-xl p-3 text-xs font-medium", theme.surfaceMuted, theme.textMuted)}>
                      {t("cart.pickupDisclaimer")}
                    </p>
                  ) : null}
                  {!isCatalogOnly
                    ? selectedPaymentMethod === "card" && (() => {
                    const activeInstallments = (storefrontSettings.card_installment_options ?? []).filter(
                      (o: InstallmentOption) => o.isActive,
                    );
                    if (!activeInstallments.length) return null;
                    return (
                      <div className="mt-3">
                        <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.16em]", theme.textMuted)}>
                          {t("cart.installmentOption")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeInstallments.map((option: InstallmentOption) => (
                            <button
                              key={option.count}
                              type="button"
                              onClick={() => setSelectedInstallmentCount(option.count)}
                              className={cn(
                                "rounded-xl px-3 py-2 text-xs font-semibold transition",
                                selectedInstallmentCount === option.count
                                  ? theme.cartInstallmentActive
                                  : theme.cartPaymentInactive,
                              )}
                            >
                              {option.label}
                              {option.surchargePercentage > 0 && (
                                <span className="ml-1 text-amber-600">
                                  +%{option.surchargePercentage}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                    : null}
                </div>

                <div className={theme.panelSurface}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className={cn("text-sm font-semibold", theme.text)}>
                      {t(isTekel ? "cart.orderNotePickup" : "cart.orderNote")}
                    </p>
                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", theme.surfaceMuted, theme.textMuted)}>
                      {t("cart.optional")}
                    </span>
                  </div>
                  <Textarea
                    placeholder={t(isTekel ? "cart.orderNotePlaceholderPickup" : "cart.orderNotePlaceholder")}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className={cn("min-h-[84px] rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
                  />
                </div>

                {recommendedProducts.length ? (
                  <section className={cn(theme.panelSurface, theme.surfaceMuted)}>
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        {t("cart.suggestedProducts")}
                      </p>
                      <h3 className={cn("mt-1 text-lg font-bold tracking-tight", theme.text)}>
                        {t("cart.youMayAlsoLike")}
                      </h3>
                    </div>

                    <div className="relative">
                      <div
                        ref={crossSellScrollRef}
                        onWheel={(event) => {
                          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
                          event.currentTarget.scrollBy({ left: event.deltaY });
                          event.preventDefault();
                        }}
                        className="scrollbar-hide -mx-1 -mt-2 flex gap-3 overflow-x-auto px-1 pb-1 pt-2"
                      >
                        {recommendedProducts.map((product) => renderCrossSellCard(product))}
                      </div>
                      {recommendedProducts.length > 2 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => scrollCrossSell("left")}
                            aria-label={t("cart.scrollLeft")}
                            className={cn(
                              theme.cartDrawerCloseButton,
                              "absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 shadow-md sm:flex",
                            )}
                          >
                            <ChevronLeft className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollCrossSell("right")}
                            aria-label={t("cart.scrollRight")}
                            className={cn(
                              theme.cartDrawerCloseButton,
                              "absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 shadow-md sm:flex",
                            )}
                          >
                            <ChevronRight className="size-5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <div className={cn("flex size-20 items-center justify-center rounded-full", theme.surfaceMuted)}>
                  <ShoppingCart className={cn("size-9", theme.textMuted)} />
                </div>
                <p className={cn("mt-5 text-base font-semibold", theme.text)}>
                  {t(isTekel ? "cart.emptyTitlePickup" : "cart.emptyTitle")}
                </p>
                <p className={cn("mt-2 max-w-xs text-sm leading-6", theme.textMuted)}>
                  {t("cart.emptyHint")}
                </p>
              </div>
            )}
          </div>

          <div className={cn("shrink-0 px-4 py-3.5 sm:px-5 lg:px-6 lg:py-4", theme.surfaceMuted)}>
            <div className={cn("rounded-[1.5rem] p-2.5 sm:p-3 lg:p-4 sm:rounded-[1.75rem]", theme.border, theme.surface, theme.elevation1, theme.surfaceRing)}>
              <div className={cn("rounded-[1.4rem] px-4 py-3", theme.elevation2, theme.cartDrawerSummary)}>
                {!isCatalogOnly && cartPaymentSummary ? (
                  <div className="space-y-2.5">
                    {(cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0) ||
                    cartPaymentSummary.campaignDiscountAmount > 0 ||
                    cartPaymentSummary.surchargeAmount > 0 ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.subtotalLine")}</p>
                          <p
                            className={cn(
                              "text-sm font-semibold tracking-tight",
                              (cartPaymentSummary.isQualified &&
                                cartPaymentSummary.discountAmount > 0) ||
                              cartPaymentSummary.campaignDiscountAmount > 0
                                ? cn(theme.cartSummaryMuted, "line-through")
                                : "text-white",
                            )}
                          >
                            {formatCurrency(
                              cartPaymentSummary.subtotal,
                              cartPaymentSummary.currency,
                            )}
                          </p>
                        </div>
                        {cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0 ? (
                          <div className="flex items-center justify-between gap-3">
                            <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>
                              {t("cart.discount", { percentage: formatDiscountPercentage(cartPaymentSummary.discountPercentage) })}
                            </p>
                            <p className="text-base font-bold tracking-tight text-emerald-300">
                              -{formatCurrency(cartPaymentSummary.discountAmount, cartPaymentSummary.currency)}
                            </p>
                          </div>
                        ) : null}
                        {cartPaymentSummary.appliedCampaign &&
                        cartPaymentSummary.campaignDiscountAmount > 0 ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>
                                {t("cart.campaignDiscount")}
                              </p>
                              <p className={cn("truncate text-[11px]", theme.cartSummaryMuted)}>
                                {cartPaymentSummary.appliedCampaign.title}
                              </p>
                            </div>
                            <p className="shrink-0 text-base font-bold tracking-tight text-emerald-300">
                              -
                              {formatCurrency(
                                cartPaymentSummary.campaignDiscountAmount,
                                cartPaymentSummary.currency,
                              )}
                            </p>
                          </div>
                        ) : null}
                        {cartPaymentSummary.surchargeAmount > 0 ? (
                          <div className="flex items-center justify-between gap-3">
                            <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>
                              {t("cart.surcharge", { percentage: formatDiscountPercentage(cartPaymentSummary.surchargePercentage) })}
                            </p>
                            <p className="text-base font-bold tracking-tight text-amber-300">
                              +{formatCurrency(cartPaymentSummary.surchargeAmount, cartPaymentSummary.currency)}
                            </p>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <p className={cn("text-sm font-medium text-neutral-200")}>{t("cart.grandTotal")}</p>
                          <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                            {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.grandTotal")}</p>
                        <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                          {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : cartDiscountSummary?.isQualified ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.subtotalLine")}</p>
                      <p className={cn("text-sm font-semibold tracking-tight line-through", theme.cartSummaryMuted)}>
                        {formatCurrency(
                          cartDiscountSummary.subtotal,
                          cartDiscountSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>
                        {t("cart.discount", { percentage: formatDiscountPercentage(cartDiscountSummary.percentage) })}
                      </p>
                      <p className="text-base font-bold tracking-tight text-emerald-300">
                        -
                        {formatCurrency(
                          cartDiscountSummary.discountAmount,
                          cartDiscountSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <p className="text-sm font-medium text-neutral-200">{t("cart.grandTotal")}</p>
                      <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                        {formatCurrency(
                          cartDiscountSummary.totalAfterDiscount,
                          cartDiscountSummary.currency,
                        )}
                      </p>
                    </div>
                  </div>
                ) : isCatalogOnly && cart.length ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.orderSummary")}</p>
                    <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                      {t("cart.itemsCountShort", { count: cartItemCount })}
                    </p>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="hidden items-center justify-between gap-3 sm:flex">
                    <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.total")}</p>
                    <p className={cn("text-base font-bold tracking-tight sm:text-lg", theme.cartSummaryMuted)}>
                      {t(isTekel ? "header.cartEmptyPickup" : "header.cartEmpty")}
                    </p>
                  </div>
                ) : cartTotalEntries.length ? (
                  <div className="space-y-2">
                    {cartTotalEntries.map(({ currency, total }) => (
                      <div
                        key={currency}
                        className="flex items-center justify-between gap-3"
                      >
                        <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.total")}</p>
                        <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                          {currency}: {formatCurrency(total, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className={cn("text-sm font-medium", theme.cartSummaryMuted)}>{t("cart.total")}</p>
                    <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                      {formatCurrency(cartTotal, cartCurrency)}
                    </p>
                  </div>
                )}
              </div>

              {!isCatalogOnly && cart.length > 0 && cartTotalEntries.length > 1 ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium leading-5 text-amber-700">
                  {t("cart.multiCurrencyWarning", {
                    currencies: cartTotalEntries.map((entry) => entry.currency).join(", "),
                  })}
                </p>
              ) : null}
              {!isCatalogOnly && cart.length > 0 && !isMinCartAmountMet ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium leading-5 text-amber-700">
                  {t("cart.minAmountNotice", {
                    remaining: formatCurrency(minCartAmountRemaining, cartCurrency),
                  })}
                </p>
              ) : null}
              {whatsappHandoff ? (
                <div className="mt-3 space-y-2">
                  <p className={cn("text-center text-xs font-medium leading-5", theme.successText)}>
                    {whatsappHandoff.pdfIncluded
                      ? t("cart.whatsappReadyPdf")
                      : t("cart.whatsappReadyText")}
                  </p>
                  {orderPdfError ? (
                    <p className="text-center text-xs font-medium text-amber-600">
                      {orderPdfError} {t("cart.orderPdfErrorSuffix")}
                    </p>
                  ) : null}
                  <a
                    href={whatsappHandoff.href}
                    className={cn(
                      "inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-base font-bold shadow-none sm:h-12",
                      stickyCartButtonClassName,
                    )}
                  >
                    {t("cart.sendViaWhatsApp")}
                  </a>
                  <button
                    type="button"
                    onClick={copyOrderMessage}
                    className={cn("w-full text-center text-xs font-semibold transition hover:opacity-80", theme.textMuted)}
                  >
                    {t("cart.copyMessage")}
                  </button>
                  {copyFeedback ? (
                    <p className={cn("text-center text-xs font-medium", theme.successText)}>{copyFeedback}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setCopyFeedback(null);
                      onClearWhatsappHandoff();
                    }}
                    className={cn("w-full text-center text-[11px] font-medium transition hover:text-rose-500", theme.textMuted)}
                  >
                    {t("cart.startOver")}
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  disabled={!canCompleteWhatsAppOrder}
                  className={cn(
                    "mt-3 h-11 w-full rounded-full px-5 text-base font-bold shadow-none sm:h-12",
                    stickyCartButtonClassName,
                    !canCompleteWhatsAppOrder && "pointer-events-none opacity-50",
                  )}
                >
                  {isGeneratingOrderPdf
                    ? t("cart.pdfPreparing")
                    : t(isTekel ? "cart.completeViaWhatsAppPickup" : "cart.completeViaWhatsApp")}
                </Button>
              )}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className={cn("mt-2 w-full text-center text-[11px] font-medium transition hover:text-rose-500", theme.textMuted)}
                >
                  {t("cart.clearCart")}
                </button>
              )}
            </div>
          </div>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
