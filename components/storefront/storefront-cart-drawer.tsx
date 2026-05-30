"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
  Store,
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
import { cn, formatCurrency } from "@/lib/utils";
import { STOREFRONT_CART_THUMB_SIZES } from "@/lib/storefront/image-sizes";
import { StorefrontImage } from "@/components/storefront/storefront-image";

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
  recommendedProducts: StorefrontProduct[];
  cartPaymentSummary: CartPaymentSummary | null;
  cartDiscountSummary: CartDiscountSummary | null;
  cartTotalEntries: Array<{ currency: string; total: number }>;
  cartTotal: number;
  cartCurrency: string;
  onWhatsAppOrder: () => void | Promise<void>;
  isGeneratingOrderPdf: boolean;
  cartStorageKey: string;
  stickyCartButtonClassName: string;
  isCashCampaignDismissedOnCart: boolean;
  isCardCampaignDismissedOnCart: boolean;
  onDismissCashCampaignOnCart: () => void;
  onDismissCardCampaignOnCart: () => void;
  renderCashDiscountBar: (compact: boolean, onDismiss?: () => void) => ReactNode;
  renderCardCampaignBar: (compact: boolean, onDismiss?: () => void) => ReactNode;
  renderCrossSellCard: (product: StorefrontProduct) => ReactNode;
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
  recommendedProducts,
  cartPaymentSummary,
  cartDiscountSummary,
  cartTotalEntries,
  cartTotal,
  cartCurrency,
  onWhatsAppOrder,
  isGeneratingOrderPdf,
  cartStorageKey,
  stickyCartButtonClassName,
  isCashCampaignDismissedOnCart,
  isCardCampaignDismissedOnCart,
  onDismissCashCampaignOnCart,
  onDismissCardCampaignOnCart,
  renderCashDiscountBar,
  renderCardCampaignBar,
  renderCrossSellCard,
}: StorefrontCartDrawerProps) {
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
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(cartStorageKey);
    }
  }

  async function handleWhatsAppOrder() {
    if (!cart.length) return;
    if (!selectedPaymentMethod) {
      setPaymentMethodError("Lütfen ödeme yönteminizi seçin.");
      return;
    }
    setPaymentMethodError(null);

    const trimmedCustomerName = customerReferenceName.trim();
    if (trimmedCustomerName.length < 2) {
      setCustomerReferenceNameError("Lütfen Müşteri / Cari Adını giriniz!");
      return;
    }
    setCustomerReferenceNameError(null);

    await onWhatsAppOrder();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md">
      <button
        type="button"
        aria-label="Sepeti kapat"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 z-10 max-h-[94dvh] rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.22)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[460px] lg:rounded-l-[2rem] lg:rounded-tr-none">
        <div className="flex h-full max-h-[94dvh] flex-col lg:max-h-none">
          <div className="flex justify-center pt-3 lg:hidden">
            <span className="h-1.5 w-14 rounded-full bg-slate-200" />
          </div>

          <div className="border-b border-slate-100 px-4 pb-3 pt-3 sm:px-5 lg:px-6 lg:pb-4 lg:pt-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2.5">
                <h2 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  Sepetim
                </h2>
                <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
                  {cartDistinctCount} kalem, {cartItemCount} ürün
                </p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                  aria-label="Sepeti kapat"
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
                    className="min-w-0 rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white sm:h-20 sm:w-20 sm:rounded-[1.35rem]">
                        {item.image_url ? (
                          <StorefrontImage
                            src={item.image_url}
                            alt={item.product_name}
                            className="object-contain p-2.5 sm:p-3"
                            sizes={STOREFRONT_CART_THUMB_SIZES}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-50">
                            <Store className="size-6 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                              {item.product_name}
                            </p>
                            {item.variant_name ? (
                              <p className="mt-0.5 text-xs font-medium text-emerald-700">
                                Model: {item.variant_name}
                              </p>
                            ) : null}
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.sku_code ? `SKU: ${item.sku_code}` : "SKU bilgisi yok"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) => updateCartLineQuantity(current, item.id, 0))
                            }
                            className="h-fit rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Ürünü sepetten çıkar"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex min-w-0 items-end justify-between gap-2 border-t border-slate-200/80 pt-3 sm:gap-3">
                      <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white p-0.5 sm:p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setCart((current) =>
                              updateCartLineQuantity(current, item.id, item.quantity - 1),
                            )
                          }
                          className="flex size-8 sm:size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                          aria-label="Adedi azalt"
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
                          className="h-8 w-11 bg-transparent py-0 text-center text-[16px] font-bold leading-none text-slate-900 outline-none sm:h-9 sm:w-14"
                          style={{ fontSize: "16px" }}
                          aria-label="Ürün adedi"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCart((current) =>
                              updateCartLineQuantity(current, item.id, item.quantity + 1),
                            )
                          }
                          className="flex size-8 sm:size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                          aria-label="Adedi artır"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>

                      <div className="ml-auto flex min-w-0 max-w-[58%] flex-1 items-end justify-end gap-2 text-right sm:max-w-none sm:gap-4">
                        <div className="min-w-0 max-w-[48%] sm:max-w-none">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px] sm:tracking-[0.18em]">
                            Birim Fiyat
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold tabular-nums text-slate-700">
                            {formatCurrency(item.price, item.currency)}
                          </p>
                        </div>
                        <div className="min-w-0 max-w-[52%] sm:max-w-none">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px] sm:tracking-[0.18em]">
                            Ara Toplam
                          </p>
                          <p className="mt-1 truncate text-sm font-bold tabular-nums tracking-tight text-slate-950 sm:text-base">
                            {formatCurrency(item.price * item.quantity, item.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-3 sm:p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Ödeme Yöntemi</p>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-600">
                      Zorunlu
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
                        "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition",
                        selectedPaymentMethod === "cash"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      <Banknote className="size-4" />
                      Nakit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentMethod("card");
                        setPaymentMethodError(null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition",
                        selectedPaymentMethod === "card"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      <CreditCard className="size-4" />
                      Kredi Kartı
                    </button>
                  </div>
                  {paymentMethodError ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">{paymentMethodError}</p>
                  ) : null}
                  <label className="mt-3 block">
                    <span className="text-sm font-semibold text-slate-900">
                      Müşteri / Cari Adı <span className="text-rose-600">*</span>
                    </span>
                    <Input
                      required
                      value={customerReferenceName}
                      onChange={(event) => {
                        setCustomerReferenceName(event.target.value);
                        if (customerReferenceNameError) {
                          setCustomerReferenceNameError(null);
                        }
                      }}
                      placeholder="Örn: Ahmet Ticaret Ltd. Şti."
                      className="mt-2 rounded-[1.1rem] border-slate-200 bg-slate-50/80 text-[16px]"
                    />
                  </label>
                  {customerReferenceNameError ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {customerReferenceNameError}
                    </p>
                  ) : null}
                  {selectedPaymentMethod === "card" && (() => {
                    const activeInstallments = (storefrontSettings.card_installment_options ?? []).filter(
                      (o: InstallmentOption) => o.isActive,
                    );
                    if (!activeInstallments.length) return null;
                    return (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Taksit Seçeneği
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeInstallments.map((option: InstallmentOption) => (
                            <button
                              key={option.count}
                              type="button"
                              onClick={() => setSelectedInstallmentCount(option.count)}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                                selectedInstallmentCount === option.count
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
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
                  })()}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-3 sm:p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Sipariş Notu</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                      Opsiyonel
                    </span>
                  </div>
                  <Textarea
                    placeholder="Sipariş notu (opsiyonel)"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-[84px] rounded-[1.1rem] border-slate-200 bg-slate-50/80 text-[16px]"
                  />
                </div>

                {recommendedProducts.length ? (
                  <section className="rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        Sepetine Uygun Ürünler
                      </p>
                      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                        Bunları da Beğenebilirsiniz
                      </h3>
                    </div>

                    <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                      {recommendedProducts.map((product) => renderCrossSellCard(product))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-slate-100">
                  <ShoppingCart className="size-9 text-slate-300" />
                </div>
                <p className="mt-5 text-base font-semibold text-slate-900">
                  Sepetiniz şu an boş.
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Ürünleri inceleyip birkaç kalemi sepete eklediğinizde sipariş özeti burada
                  premium bir şekilde listelenecek.
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3.5 sm:px-5 lg:px-6 lg:py-4">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-2.5 sm:p-3 lg:p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:rounded-[1.75rem]">
              <div className="rounded-[1.4rem] bg-slate-950 px-4 py-3 text-white shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
                {cartPaymentSummary ? (
                  <div className="space-y-2.5">
                    {(cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0) ||
                    cartPaymentSummary.surchargeAmount > 0 ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-300">Ara Toplam</p>
                          <p
                            className={cn(
                              "text-sm font-semibold tracking-tight",
                              cartPaymentSummary.isQualified && cartPaymentSummary.discountAmount > 0
                                ? "text-slate-400 line-through"
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
                            <p className="text-sm font-medium text-slate-300">
                              İskonto (%{formatDiscountPercentage(cartPaymentSummary.discountPercentage)})
                            </p>
                            <p className="text-base font-bold tracking-tight text-emerald-300">
                              -{formatCurrency(cartPaymentSummary.discountAmount, cartPaymentSummary.currency)}
                            </p>
                          </div>
                        ) : null}
                        {cartPaymentSummary.surchargeAmount > 0 ? (
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-300">
                              Vade Farkı (%{formatDiscountPercentage(cartPaymentSummary.surchargePercentage)})
                            </p>
                            <p className="text-base font-bold tracking-tight text-amber-300">
                              +{formatCurrency(cartPaymentSummary.surchargeAmount, cartPaymentSummary.currency)}
                            </p>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                          <p className="text-sm font-medium text-slate-200">Genel Toplam</p>
                          <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                            {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-300">Genel Toplam</p>
                        <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                          {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : cartDiscountSummary?.isQualified ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-300">Ara Toplam</p>
                      <p className="text-sm font-semibold tracking-tight text-slate-400 line-through">
                        {formatCurrency(
                          cartDiscountSummary.subtotal,
                          cartDiscountSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-300">
                        İskonto (%{formatDiscountPercentage(cartDiscountSummary.percentage)})
                      </p>
                      <p className="text-base font-bold tracking-tight text-emerald-300">
                        -
                        {formatCurrency(
                          cartDiscountSummary.discountAmount,
                          cartDiscountSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                      <p className="text-sm font-medium text-slate-200">Genel Toplam</p>
                      <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                        {formatCurrency(
                          cartDiscountSummary.totalAfterDiscount,
                          cartDiscountSummary.currency,
                        )}
                      </p>
                    </div>
                  </div>
                ) : cartTotalEntries.length ? (
                  <div className="space-y-2">
                    {cartTotalEntries.map(({ currency, total }) => (
                      <div
                        key={currency}
                        className="flex items-center justify-between gap-3"
                      >
                        <p className="text-sm font-medium text-slate-300">Toplam</p>
                        <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                          {currency}: {formatCurrency(total, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-300">Toplam</p>
                    <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                      {formatCurrency(cartTotal, cartCurrency)}
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleWhatsAppOrder}
                disabled={!selectedPaymentMethod || isGeneratingOrderPdf}
                className={cn(
                  "mt-3 h-11 w-full rounded-full px-5 text-base font-bold shadow-none sm:h-12",
                  stickyCartButtonClassName,
                  (!cart.length || !selectedPaymentMethod || isGeneratingOrderPdf) &&
                    "pointer-events-none opacity-50",
                )}
              >
                {isGeneratingOrderPdf
                  ? "PDF hazırlanıyor..."
                  : "WhatsApp ile Siparişi Tamamla"}
              </Button>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-2 w-full text-center text-[11px] font-medium text-slate-400 transition hover:text-rose-500"
                >
                  Sepeti Boşalt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
