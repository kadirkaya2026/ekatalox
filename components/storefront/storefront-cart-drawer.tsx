"use client";

import { useEffect, useRef, useState, type Dispatch, ReactNode, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Check,
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
import { formatProductModelNo, type CurrencyCode } from "@/lib/products/constants";
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
  cartTotalEntries: Array<{ currency: CurrencyCode; total: number }>;
  cartTotal: number;
  cartCurrency: CurrencyCode;
  isMinCartAmountMet: boolean;
  minCartAmountRemaining: number;
  // Getirme (teslimat) ücreti — yalnız market tenantlar (0108). Ödeme yöntemi
  // seçili değilken de gösterilir. 0 = ücret yok / uygulanmıyor.
  deliveryFeeAmount: number;
  // Ücretsiz teslimat barajına kalan tutar (baraj yoksa 0).
  deliveryFeeRemaining: number;
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
  renderCrossSellCard: (product: StorefrontProduct, compact?: boolean) => ReactNode;
  /** "Yanında iyi gider" tamamlayıcıları: doluysa öneri şeridinin yerine geçer */
  recommendedOverride?: StorefrontProduct[] | null;
  recommendedOverrideTitle?: string;
  /**
   * Adım 2 ("bunları unutmuş olabilirsiniz") için DONMUŞ öneri listesi. Parent
   * tutuyor ki bu ürünler productsById'ye de girsin (yoksa "+" sessizce çalışmaz).
   */
  frozenSuggestions?: StorefrontProduct[];
  /** Adım 2'ye geçilirken çağrılır: parent o anki öneri listesini dondurur. */
  onSnapshotSuggestions?: () => void;
  /** "Ücretsiz teslimat için ... ekleyin" ipucuna tıklanınca: çekmeceyi
   *  kapat, ana katalog görünümüne dön (market/tekel). */
  onGoHome?: () => void;
  /** "Siparişi Ver"e eksik alanla her basışta artar — drawer ilk eksik alana kayar. */
  checkoutValidationNonce?: number;
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
  deliveryFeeAmount,
  deliveryFeeRemaining,
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
  recommendedOverride = null,
  recommendedOverrideTitle,
  frozenSuggestions = [],
  onSnapshotSuggestions,
  onGoHome,
  checkoutValidationNonce = 0,
  isCatalogOnly = false,
}: StorefrontCartDrawerProps) {
  const suggestedList = recommendedOverride?.length ? recommendedOverride : recommendedProducts;
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  // "WhatsApp'tan gönder"e basıldı: sepet temizlendi, boş sepet yerine
  // "gönderildi" ekranı ve takip linki gösterilir (kullanıcı isteği, 29 Ağu 2026).
  // Sepete yeni ürün eklenince kendiliğinden kaybolur.
  const [sentOrder, setSentOrder] = useState<{ trackingUrl: string | null } | null>(null);
  const crossSellScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  // Son adımda zorunlu alanların kapsayıcıları — "Siparişi Ver"e eksik alanla
  // basıldığında ilk eksik alana kaydırmak için.
  const paymentFieldRef = useRef<HTMLDivElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const addressFieldRef = useRef<HTMLDivElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);

  // Adımlı sepet akışı yalnız market/tekelde (kullanıcı kararı, 3 Eyl 2026):
  //   1) ürünler + fiyat + adet
  //   2) "bunları unutmuş olabilirsiniz" (öneri ürünler; öneri yoksa atlanır)
  //   3) sipariş bilgileri (ödeme yöntemi, isim/adres/telefon, not) + "Siparişi Ver"
  // Toptancı/genel tipte eski tek sayfalı düzen korunur.
  const useStepFlow = isMarketTenant;
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Çekmece her AÇILDIĞINDA baştan başlat (kapalı -> açık geçişinde, render
  // sırasında ayarlama — React'in "Adjusting state when a prop changes"
  // önerdiği desen). Handoff ekranı açıkken (kullanıcı "gönder"e basmak için
  // geri döndü) son adımda kal. clearCart() ayrıca setStep(1) çağırır; sepet
  // boşken adım değeri zaten kullanılmıyor (footer kontrolleri cart.length > 0).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && !whatsappHandoff) {
      setStep(1);
    } else if (isOpen) {
      setStep(3);
    }
  }

  // Adım değişince gövdeyi başa sar.
  useEffect(() => {
    bodyScrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  // "Siparişi Ver"e eksik zorunlu alanla basıldı: müşteri neden sipariş
  // veremediğini anlasın diye ilk eksik alana kaydır (öncelik: ödeme yöntemi ->
  // isim -> adres -> telefon; handleWhatsAppOrder'daki doğrulama sırasıyla aynı).
  useEffect(() => {
    const target = paymentMethodError
      ? paymentFieldRef.current
      : customerReferenceNameError
        ? nameFieldRef.current
        : customerAddressError
          ? addressFieldRef.current
          : customerPhoneError
            ? phoneFieldRef.current
            : null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [
    checkoutValidationNonce,
    paymentMethodError,
    customerReferenceNameError,
    customerAddressError,
    customerPhoneError,
  ]);

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
    setStep(1);
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
  const isSingleCurrencyCart = cartTotalEntries.length <= 1;
  // Adım 1'den ilerleme: sepet dolu, minimum tutar sağlanmış ve tek para birimi.
  const canAdvanceFromCart =
    cart.length > 0 && isMinCartAmountMet && isSingleCurrencyCart;

  // Adım 2'de gösterilecek liste: donmuş kopya (bkz. frozenSuggestions).
  // Henüz dondurulmadıysa (ör. tek sayfalı akış hiç 2. adıma girmeden) canlı
  // listeye düşülür.
  const stepSuggestions = frozenSuggestions.length ? frozenSuggestions : suggestedList;

  function goForwardFromCart() {
    if (suggestedList.length) {
      onSnapshotSuggestions?.();
      setStep(2);
    } else {
      setStep(3);
    }
  }
  function goBack() {
    // 3 -> 2'ye dönerken donmuş liste korunur (yeniden snapshot alınmaz).
    if (step === 3) setStep(frozenSuggestions.length ? 2 : 1);
    else setStep(1);
  }

  // ─── Ortak render parçaları ──────────────────────────────────────────────

  const renderCampaignBars = () =>
    selectedPaymentMethod === "cash"
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
          );

  const renderItemsList = () => (
    <>
      {cart.map((item) => (
        <div key={item.id} className={theme.cartDrawerItem}>
          <div className="flex gap-3">
            <div
              className={cn(
                "relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[1.15rem] sm:h-20 sm:w-20 sm:rounded-[1.35rem]",
                theme.border,
                theme.productThumbSurface,
              )}
            >
              {item.image_url ? (
                <StorefrontImage
                  src={item.image_url}
                  alt={item.product_name}
                  className="object-contain p-2.5 sm:p-3"
                  sizes={STOREFRONT_CART_THUMB_SIZES}
                />
              ) : (
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center",
                    theme.surfaceMuted,
                  )}
                >
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
                  className={cn(
                    "h-fit rounded-full p-2 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50",
                    theme.textMuted,
                  )}
                  aria-label={t("cart.removeItemAria")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex min-w-0 items-end justify-between gap-2 pt-3 sm:gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center rounded-full p-0.5 shadow-sm sm:p-1",
                theme.quantityStepper,
              )}
            >
              <button
                type="button"
                onClick={() =>
                  setCart((current) =>
                    updateCartLineQuantity(current, item.id, item.quantity - 1),
                  )
                }
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition sm:size-9",
                  theme.quantityStepperButton,
                )}
                aria-label={t("cart.decreaseAria")}
              >
                <Minus className="size-4" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={item.quantity}
                onChange={(event) => updateCartItemQuantity(item.id, event.target.value)}
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
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition sm:size-9",
                  theme.quantityStepperButton,
                )}
                aria-label={t("cart.increaseAria")}
              >
                <Plus className="size-4" />
              </button>
            </div>

            {!isCatalogOnly ? (
              <div className="ml-auto flex min-w-0 max-w-[58%] flex-1 items-end justify-end gap-2 text-right sm:max-w-none sm:gap-4">
                <div className="min-w-0 max-w-[48%] sm:max-w-none">
                  <p
                    className={cn(
                      "truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.18em]",
                      theme.textMuted,
                    )}
                  >
                    {t("cart.unitPrice")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 truncate text-sm font-semibold tabular-nums",
                      theme.textMuted,
                    )}
                  >
                    {item.price !== null ? formatCurrency(item.price, item.currency) : "—"}
                  </p>
                </div>
                <div className="min-w-0 max-w-[52%] sm:max-w-none">
                  <p
                    className={cn(
                      "truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.18em]",
                      theme.textMuted,
                    )}
                  >
                    {t("cart.subtotalLine")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 truncate text-sm font-bold tabular-nums tracking-tight sm:text-base",
                      theme.text,
                    )}
                  >
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
    </>
  );

  const renderPaymentPanel = () => (
    <div className={theme.panelSurface}>
      {/* Ödeme yöntemi fiyatsız katalogda da seçilebilir (kullanıcı kararı, 29 Ağu 2026):
          tutar hesabı yok ama "nakit / kart" bilgisi fişe ve siparişe işlenir. */}
      <>
        <div ref={paymentFieldRef} className="mb-3 flex items-center justify-between gap-3">
          <p className={cn("text-sm font-semibold", theme.text)}>{t("cart.paymentMethod")}</p>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              theme.surfaceMuted,
              theme.textMuted,
            )}
          >
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
      {isMarketTenant ? (
        <div ref={phoneFieldRef} className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className={cn("text-sm font-semibold", theme.text)}>{t("cart.customerPhone")}</span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold",
                theme.surfaceMuted,
                theme.textMuted,
              )}
            >
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

      <div ref={nameFieldRef} className="mt-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className={cn("text-sm font-semibold", theme.text)}>
            {t("cart.customerReferenceName")}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              theme.surfaceMuted,
              theme.textMuted,
            )}
          >
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
          <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>
            {customerReferenceNameError}
          </p>
        ) : null}
      </div>

      {isMarketTenant ? (
        <div ref={addressFieldRef} className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className={cn("text-sm font-semibold", theme.text)}>
              {t(isTekel ? "cart.customerAddressPickup" : "cart.customerAddress")}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold",
                theme.surfaceMuted,
                theme.textMuted,
              )}
            >
              {t("cart.required")}
            </span>
          </div>
          <Textarea
            value={customerAddress}
            onChange={(event) => {
              setCustomerAddress(event.target.value);
              setCustomerAddressError(null);
            }}
            placeholder={t(
              isTekel ? "cart.customerAddressPickupPlaceholder" : "cart.customerAddressPlaceholder",
            )}
            className={cn("rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
          />
          {customerAddressError ? (
            <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{customerAddressError}</p>
          ) : null}
        </div>
      ) : null}
      {isMarketTenant && isTekel ? (
        <p
          className={cn(
            "mt-3 rounded-xl p-3 text-xs font-medium",
            theme.surfaceMuted,
            theme.textMuted,
          )}
        >
          {t("cart.pickupDisclaimer")}
        </p>
      ) : null}
      {!isCatalogOnly
        ? selectedPaymentMethod === "card" &&
          (() => {
            const activeInstallments = (storefrontSettings.card_installment_options ?? []).filter(
              (o: InstallmentOption) => o.isActive,
            );
            if (!activeInstallments.length) return null;
            return (
              <div className="mt-3">
                <p
                  className={cn(
                    "mb-2 text-xs font-semibold uppercase tracking-[0.16em]",
                    theme.textMuted,
                  )}
                >
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
                        <span className="ml-1 text-amber-600">+%{option.surchargePercentage}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()
        : null}
    </div>
  );

  const renderOrderNotePanel = () => (
    <div className={theme.panelSurface}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className={cn("text-sm font-semibold", theme.text)}>
          {t(isTekel ? "cart.orderNotePickup" : "cart.orderNote")}
        </p>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold",
            theme.surfaceMuted,
            theme.textMuted,
          )}
        >
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
  );

  // Öneri şeridi — eski tek sayfalı düzende sepetin altında yatay kayan şerit.
  const renderInlineSuggestions = () =>
    suggestedList.length ? (
      <section className={cn(theme.panelSurface, theme.surfaceMuted)}>
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {t("cart.suggestedProducts")}
          </p>
          <h3 className={cn("mt-1 text-lg font-bold tracking-tight", theme.text)}>
            {recommendedOverride?.length && recommendedOverrideTitle
              ? recommendedOverrideTitle
              : t("cart.youMayAlsoLike")}
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
            {suggestedList.map((product) => renderCrossSellCard(product))}
          </div>
          {suggestedList.length > 2 ? (
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
    ) : null;

  // Adım 2 — "bunları unutmuş olabilirsiniz": öneri ürünler ızgara görünümde.
  const renderStepSuggestions = () => (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
          {t("pair.goesWellWith")}
        </p>
        <h3 className={cn("mt-1 text-lg font-bold tracking-tight", theme.text)}>{t("nudge.title")}</h3>
        <p className={cn("mt-1 text-sm leading-6", theme.textMuted)}>{t("nudge.subtitle")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5 [&_article]:!min-w-0 [&_article]:!max-w-none">
        {stepSuggestions.map((product) => renderCrossSellCard(product, true))}
      </div>
    </div>
  );

  // Market/tekel (adımlı akış) özet kutusu daha derli toplu: yazılar bir tık
  // küçük, satır araları dar (kullanıcı isteği, 4 Eyl 2026). Toptancı/genel
  // tipte eski ölçüler korunur.
  const sc = useStepFlow;
  const sumGapCls = sc ? "space-y-1.5" : "space-y-2.5";
  const sumLabelCls = sc ? "text-[12.5px] font-medium" : "text-sm font-medium";
  const sumSideValueCls = sc
    ? "text-sm font-bold tracking-tight"
    : "text-base font-bold tracking-tight";
  const sumTotalRowCls = sc
    ? "flex items-center justify-between gap-3 pt-1.5"
    : "flex items-center justify-between gap-3 pt-2";
  const sumTotalValueCls = sc
    ? "text-sm font-bold tracking-tight text-white"
    : "text-base font-bold tracking-tight text-white sm:text-lg";

  const summaryBoxCls = cn(
    sc ? "rounded-[1.1rem] px-3 py-2" : "rounded-[1.4rem] px-4 py-3",
    theme.elevation2,
    theme.cartDrawerSummary,
  );

  const renderSummaryBox = () => {
    // Adım 1'de (market/tekel) yalnız "Genel Toplam" görünür; kırılım
    // (ara toplam / kampanya / teslimat ücreti) son adıma bırakılır
    // (kullanıcı isteği, 4 Eyl 2026).
    if (sc && step === 1) {
      return (
        <div className={summaryBoxCls}>
          <div className="flex items-center justify-between gap-3">
            <p className={cn(sumLabelCls, "text-neutral-200")}>{t("cart.grandTotal")}</p>
            <p className={sumTotalValueCls}>
              {formatCurrency(cartTotal + deliveryFeeAmount, cartCurrency)}
            </p>
          </div>
        </div>
      );
    }

    return (
    <div className={summaryBoxCls}>
      {!isCatalogOnly && cartPaymentSummary ? (
        <div className={sumGapCls}>
          {(cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0) ||
          cartPaymentSummary.campaignDiscountAmount > 0 ||
          cartPaymentSummary.couponDiscountAmount > 0 ||
          cartPaymentSummary.surchargeAmount > 0 ||
          cartPaymentSummary.deliveryFeeAmount > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
                  {t("cart.subtotalLine")}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold tracking-tight",
                    (cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0) ||
                      cartPaymentSummary.campaignDiscountAmount > 0 ||
                      cartPaymentSummary.couponDiscountAmount > 0
                      ? cn(theme.cartSummaryMuted, "line-through")
                      : "text-white",
                  )}
                >
                  {formatCurrency(cartPaymentSummary.subtotal, cartPaymentSummary.currency)}
                </p>
              </div>
              {cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
                    {t("cart.discount", {
                      percentage: formatDiscountPercentage(cartPaymentSummary.discountPercentage),
                    })}
                  </p>
                  <p className={cn("text-emerald-300", sumSideValueCls)}>
                    -{formatCurrency(cartPaymentSummary.discountAmount, cartPaymentSummary.currency)}
                  </p>
                </div>
              ) : null}
              {cartPaymentSummary.appliedCampaign && cartPaymentSummary.campaignDiscountAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
                      {t("cart.campaignDiscount")}
                    </p>
                    <p className={cn("truncate text-[11px]", theme.cartSummaryMuted)}>
                      {cartPaymentSummary.appliedCampaign.title}
                    </p>
                  </div>
                  <p className={cn("shrink-0 text-emerald-300", sumSideValueCls)}>
                    -{formatCurrency(cartPaymentSummary.campaignDiscountAmount, cartPaymentSummary.currency)}
                  </p>
                </div>
              ) : null}
              {cartPaymentSummary.appliedCoupon && cartPaymentSummary.couponDiscountAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
                      🎁 {t("coupon.cartLine")}
                    </p>
                    <p className={cn("truncate text-[11px]", theme.cartSummaryMuted)}>
                      {cartPaymentSummary.appliedCoupon.title}
                    </p>
                  </div>
                  <p className={cn("shrink-0 text-emerald-300", sumSideValueCls)}>
                    -{formatCurrency(cartPaymentSummary.couponDiscountAmount, cartPaymentSummary.currency)}
                  </p>
                </div>
              ) : null}
              {cartPaymentSummary.surchargeAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
                    {t("cart.surcharge", {
                      percentage: formatDiscountPercentage(cartPaymentSummary.surchargePercentage),
                    })}
                  </p>
                  <p className={cn("text-amber-300", sumSideValueCls)}>
                    +{formatCurrency(cartPaymentSummary.surchargeAmount, cartPaymentSummary.currency)}
                  </p>
                </div>
              ) : null}
              {cartPaymentSummary.deliveryFeeAmount > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
                    {t("cart.deliveryFee")}
                  </p>
                  <p className={cn("text-amber-300", sumSideValueCls)}>
                    +{formatCurrency(cartPaymentSummary.deliveryFeeAmount, cartPaymentSummary.currency)}
                  </p>
                </div>
              ) : null}
              <div className={sumTotalRowCls}>
                <p className={cn(sumLabelCls, "text-neutral-200")}>{t("cart.grandTotal")}</p>
                <p className={sumTotalValueCls}>
                  {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.grandTotal")}</p>
              <p className={sumTotalValueCls}>
                {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
              </p>
            </div>
          )}
        </div>
      ) : cartDiscountSummary?.isQualified ? (
        <div className={sumGapCls}>
          <div className="flex items-center justify-between gap-3">
            <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.subtotalLine")}</p>
            <p
              className={cn(
                "text-sm font-semibold tracking-tight line-through",
                theme.cartSummaryMuted,
              )}
            >
              {formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>
              {t("cart.discount", {
                percentage: formatDiscountPercentage(cartDiscountSummary.percentage),
              })}
            </p>
            <p className={cn("text-emerald-300", sumSideValueCls)}>
              -{formatCurrency(cartDiscountSummary.discountAmount, cartDiscountSummary.currency)}
            </p>
          </div>
          <div className={sumTotalRowCls}>
            <p className={cn(sumLabelCls, "text-neutral-200")}>{t("cart.grandTotal")}</p>
            <p className={sumTotalValueCls}>
              {formatCurrency(cartDiscountSummary.totalAfterDiscount, cartDiscountSummary.currency)}
            </p>
          </div>
        </div>
      ) : isCatalogOnly && cart.length ? (
        <div className="flex items-center justify-between gap-3">
          <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.orderSummary")}</p>
          <p className={sumTotalValueCls}>
            {t("cart.itemsCountShort", { count: cartItemCount })}
          </p>
        </div>
      ) : cart.length === 0 ? (
        <div className="hidden items-center justify-between gap-3 sm:flex">
          <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.total")}</p>
          <p className={cn("text-base font-bold tracking-tight sm:text-lg", theme.cartSummaryMuted)}>
            {t(isTekel ? "header.cartEmptyPickup" : "header.cartEmpty")}
          </p>
        </div>
      ) : deliveryFeeAmount > 0 && cartTotalEntries.length <= 1 ? (
        <div className={sumGapCls}>
          <div className="flex items-center justify-between gap-3">
            <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.subtotalLine")}</p>
            <p className={cn("text-sm font-semibold tracking-tight", theme.cartSummaryMuted)}>
              {formatCurrency(cartTotal, cartCurrency)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.deliveryFee")}</p>
            <p className={cn("text-amber-300", sumSideValueCls)}>
              +{formatCurrency(deliveryFeeAmount, cartCurrency)}
            </p>
          </div>
          <div className={sumTotalRowCls}>
            <p className={cn(sumLabelCls, "text-neutral-200")}>{t("cart.grandTotal")}</p>
            <p className={sumTotalValueCls}>
              {formatCurrency(cartTotal + deliveryFeeAmount, cartCurrency)}
            </p>
          </div>
        </div>
      ) : cartTotalEntries.length ? (
        <div className="space-y-2">
          {cartTotalEntries.map(({ currency, total }) => (
            <div key={currency} className="flex items-center justify-between gap-3">
              <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.total")}</p>
              <p className={sumTotalValueCls}>
                {currency}: {formatCurrency(total, currency)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className={cn(sumLabelCls, theme.cartSummaryMuted)}>{t("cart.total")}</p>
          <p className={sumTotalValueCls}>
            {formatCurrency(cartTotal, cartCurrency)}
          </p>
        </div>
      )}
    </div>
    );
  };

  const renderFooterNotices = () => (
    <>
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
      {/* Ücretsiz teslimat ipucu: market/tekelde özet kutusunun ÜSTÜNde
          tıklanabilir buton olarak gösteriliyor (bkz. renderFreeDeliveryHint);
          burada yalnız toptancı/genel tipte düz metin olarak kalıyor. */}
      {!useStepFlow && !isCatalogOnly && cart.length > 0 && deliveryFeeRemaining > 0 ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-medium leading-5 text-emerald-700">
          {t("cart.deliveryFeeFreeHint", {
            remaining: formatCurrency(deliveryFeeRemaining, cartCurrency),
          })}
        </p>
      ) : null}
      {/* Sert reddetme (engelli telefon/IP, 403/429): WhatsApp kutusu hiç
          açılmaz, bu yüzden hata BURADA bağımsız gösterilmeli. */}
      {!whatsappHandoff && orderPdfError ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-medium leading-5 text-rose-700">
          {orderPdfError}
        </p>
      ) : null}
    </>
  );

  // Market/tekel: "ücretsiz teslimat için ... ekleyin" tıklanabilir buton.
  // Özet kutusunun ÜSTÜNde durur ki "Siparişi Ver"e basarken yanlışlıkla
  // tıklanmasın (kullanıcı isteği, 4 Eyl 2026). Tıklayınca çekmece kapanır
  // ve müşteri ana katalog görünümüne döner.
  const renderFreeDeliveryHint = () =>
    !isCatalogOnly && cart.length > 0 && deliveryFeeRemaining > 0 && onGoHome ? (
      <button
        type="button"
        onClick={onGoHome}
        className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-left text-xs font-medium leading-5 text-emerald-700 transition active:scale-[0.99]"
      >
        <span>
          {t("cart.deliveryFeeFreeHint", {
            remaining: formatCurrency(deliveryFeeRemaining, cartCurrency),
          })}
        </span>
        <ChevronRight className="size-4 shrink-0" />
      </button>
    ) : null;

  // Handoff kutusu VEYA birincil sipariş butonu. `label`/`onCta` adıma göre değişir.
  const renderHandoffOrCta = (opts: { label: string; onCta: () => void }) =>
    whatsappHandoff ? (
      <div className="mt-3 space-y-2">
        <p className={cn("text-center text-xs font-medium leading-5", theme.successText)}>
          {whatsappHandoff.pdfIncluded ? t("cart.whatsappReadyPdf") : t("cart.whatsappReadyText")}
        </p>
        {orderPdfError ? (
          <p className="text-center text-xs font-medium text-amber-600">
            {orderPdfError} {t("cart.orderPdfErrorSuffix")}
          </p>
        ) : null}
        <a
          href={whatsappHandoff.href}
          onClick={() => {
            // Gezinme (wa.me) engellenmez. Sepet yalnız market/tekelde
            // sıfırlanır; toptancıda müşteri (bayi) aynı sepetle
            // çalışmaya devam eder (kullanıcı kararı, 3 Eyl 2026).
            if (!isMarketTenant) return;
            setSentOrder({ trackingUrl: whatsappHandoff.trackingUrl ?? null });
            setCopyFeedback(null);
            clearCart();
          }}
          className={cn(
            "inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-base font-bold shadow-none sm:h-12",
            stickyCartButtonClassName,
          )}
        >
          {t("cart.sendViaWhatsApp")}
        </a>
        {isMarketTenant ? (
          // Market'te "Sepeti Boşalt" gösterilmiyor (kullanıcı isteği,
          // 4 Eyl 2026) — müşteri gerekirse ürünleri tek tek siler.
          null
        ) : (
          <>
            {whatsappHandoff.trackingUrl ? (
              <a
                href={whatsappHandoff.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "block w-full text-center text-xs font-semibold underline underline-offset-2 transition hover:opacity-80",
                  theme.textMuted,
                )}
              >
                {t("cart.trackOrder")}
              </a>
            ) : null}
            <button
              type="button"
              onClick={copyOrderMessage}
              className={cn(
                "w-full text-center text-xs font-semibold transition hover:opacity-80",
                theme.textMuted,
              )}
            >
              {t("cart.copyMessage")}
            </button>
            {copyFeedback ? (
              <p className={cn("text-center text-xs font-medium", theme.successText)}>
                {copyFeedback}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCopyFeedback(null);
                onClearWhatsappHandoff();
              }}
              className={cn(
                "w-full text-center text-[11px] font-medium transition hover:text-rose-500",
                theme.textMuted,
              )}
            >
              {t("cart.startOver")}
            </button>
          </>
        )}
      </div>
    ) : (
      <Button
        type="button"
        onClick={opts.onCta}
        disabled={!canCompleteWhatsAppOrder}
        className={cn(
          "mt-3 h-11 w-full rounded-full px-5 text-base font-bold shadow-none sm:h-12",
          stickyCartButtonClassName,
          !canCompleteWhatsAppOrder && "pointer-events-none opacity-50",
        )}
      >
        {isGeneratingOrderPdf ? t("cart.pdfPreparing") : opts.label}
      </Button>
    );

  const nonMarketCtaLabel = t(
    isTekel ? "cart.completeViaWhatsAppPickup" : "cart.completeViaWhatsApp",
  );

  // Adımlı akışın başlığı hangi adımda olduğumuza göre değişir.
  const stepHeaderTitle =
    useStepFlow && cart.length > 0 && !sentOrder
      ? step === 1
        ? t(isTekel ? "cart.titlePickup" : "cart.title")
        : step === 2
          ? t("pair.forgotTitle")
          : t("cart.step.infoTitle")
      : t(isTekel ? "cart.titlePickup" : "cart.title");

  const showStepBackButton =
    useStepFlow && cart.length > 0 && !sentOrder && !whatsappHandoff && step > 1;

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
            <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] lg:pt-0">
              <div className="flex justify-center pt-3 lg:hidden">
                <span className={theme.cartDrawerHandle} />
              </div>

              <div
                className={cn(
                  theme.cartDrawerHeaderBorder,
                  "px-4 pb-3 pt-3 sm:px-5 lg:px-6 lg:pb-4 lg:pt-5",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {showStepBackButton ? (
                      <button
                        type="button"
                        onClick={goBack}
                        className={theme.cartDrawerCloseButton}
                        aria-label={t("cart.step.back")}
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                    ) : null}
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <h2 className={theme.cartDrawerTitle}>{stepHeaderTitle}</h2>
                      {!useStepFlow || !cart.length || sentOrder || step === 1 ? (
                        <p
                          className={cn(
                            "truncate text-xs font-medium sm:text-sm",
                            theme.cartDrawerMuted,
                          )}
                        >
                          {t("cart.lineSummary", {
                            distinct: cartDistinctCount,
                            count: cartItemCount,
                          })}
                        </p>
                      ) : null}
                    </div>
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

              <div
                ref={bodyScrollRef}
                className={cn(
                  "safe-bottom-padding flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6",
                  // Kaydırma alanı, sabit özet/aksiyon barından AÇIKÇA farklı
                  // (daha açık) bir yüzey — ayrı kaydırılabilir bölge belli olsun.
                  theme.cartDrawerScroll,
                )}
              >
                {cart.length ? (
                  useStepFlow ? (
                    step === 1 ? (
                      <div className="space-y-4">
                        {renderCampaignBars()}
                        {renderItemsList()}
                      </div>
                    ) : step === 2 ? (
                      renderStepSuggestions()
                    ) : (
                      <div className="space-y-4">
                        {renderPaymentPanel()}
                        {renderOrderNotePanel()}
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {renderCampaignBars()}
                      {renderItemsList()}
                      {renderPaymentPanel()}
                      {renderOrderNotePanel()}
                      {renderInlineSuggestions()}
                    </div>
                  )
                ) : sentOrder ? (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                    <div
                      className={cn(
                        "flex size-20 items-center justify-center rounded-full",
                        theme.surfaceMuted,
                      )}
                    >
                      <Check className={cn("size-9", theme.successText)} />
                    </div>
                    <p className={cn("mt-5 text-base font-semibold", theme.text)}>
                      {t("cart.orderSentTitle")}
                    </p>
                    <p className={cn("mt-2 max-w-xs text-sm leading-6", theme.textMuted)}>
                      {t("cart.orderSentBody")}
                    </p>
                    {sentOrder.trackingUrl ? (
                      <a
                        href={sentOrder.trackingUrl}
                        className={cn(
                          "mt-5 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold shadow-none",
                          stickyCartButtonClassName,
                        )}
                      >
                        {t("cart.trackOrder")}
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSentOrder(null)}
                      className={cn(
                        "mt-4 text-xs font-semibold underline underline-offset-2 transition hover:opacity-80",
                        theme.textMuted,
                      )}
                    >
                      {t("cart.newOrder")}
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                    <div
                      className={cn(
                        "flex size-20 items-center justify-center rounded-full",
                        theme.surfaceMuted,
                      )}
                    >
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

              <div
                className={cn(
                  "shrink-0 sm:px-5 lg:px-6",
                  // Market/tekelde özet alanı olabildiğince derli toplu.
                  useStepFlow ? "px-3 py-2" : "px-4 py-3.5 lg:py-4",
                  // Ayraç çizgisi + yukarı gölge + opak zemin (tema bazlı).
                  theme.cartDrawerFooter,
                )}
              >
                <div
                  className={cn(
                    useStepFlow
                      ? "rounded-[1.25rem] p-1.5"
                      : "rounded-[1.5rem] p-2.5 sm:p-3 lg:p-4 sm:rounded-[1.75rem]",
                    theme.border,
                    theme.surface,
                    theme.elevation1,
                    theme.surfaceRing,
                  )}
                >
                  {useStepFlow && cart.length > 0 && !sentOrder && !whatsappHandoff && step === 2 ? (
                    // Adım 2 alt bar: Sepete Dön + Devam
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setStep(1)}
                        className="h-11 flex-1 rounded-full px-4 text-sm font-bold shadow-none sm:h-12"
                      >
                        {t("nudge.back")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(3)}
                        className={cn(
                          "h-11 flex-1 rounded-full px-4 text-base font-bold shadow-none sm:h-12",
                          stickyCartButtonClassName,
                        )}
                      >
                        {t("cart.step.continue")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {renderFreeDeliveryHint()}
                      {renderSummaryBox()}
                      {renderFooterNotices()}

                      {useStepFlow &&
                      cart.length > 0 &&
                      !sentOrder &&
                      !whatsappHandoff &&
                      step === 1 ? (
                        <Button
                          type="button"
                          onClick={goForwardFromCart}
                          disabled={!canAdvanceFromCart}
                          className={cn(
                            "mt-3 h-11 w-full rounded-full px-5 text-base font-bold shadow-none sm:h-12",
                            stickyCartButtonClassName,
                            !canAdvanceFromCart && "pointer-events-none opacity-50",
                          )}
                        >
                          {t("cart.step.continue")}
                        </Button>
                      ) : (
                        renderHandoffOrCta({
                          label: useStepFlow ? t("cart.step.placeOrder") : nonMarketCtaLabel,
                          onCta: handleWhatsAppOrder,
                        })
                      )}

                      {/* "Sepeti Boşalt" market'te gösterilmiyor (kullanıcı
                          isteği, 4 Eyl 2026); toptancı/genel tipte kalıyor. */}
                      {!useStepFlow && cart.length > 0 && (
                        <button
                          type="button"
                          onClick={clearCart}
                          className={cn(
                            "mt-2 w-full text-center text-[11px] font-medium transition hover:text-rose-500",
                            theme.textMuted,
                          )}
                        >
                          {t("cart.clearCart")}
                        </button>
                      )}
                    </>
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
