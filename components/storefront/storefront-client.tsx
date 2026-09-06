"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, CreditCard, Megaphone, Minus, Plus, Search, ShoppingCart, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  buildCategoryTree,
  getCategoryLineage,
  getDescendantCategoryIds,
  sortCategoriesByOrder,
} from "@/lib/categories/tree";
import { supportedCurrencyCodes, formatProductModelNo } from "@/lib/products/constants";
import {
  buildWhatsAppOrderHandoff,
  type WhatsAppOrderHandoff,
} from "@/lib/storefront/whatsapp-order";
import {
  ORDER_PDF_ERROR_MESSAGE,
  OrderPdfRequestError,
  requestOrderReceiptPdf,
} from "@/lib/storefront/order-pdf-request";
import {
  getCampaignDiscountStatus,
  buildWhatsAppMessage,
  CartDiscountConfig,
  formatDiscountPercentage,
  getCartCardCampaignStatus,
  getCartCurrency,
  getCartDiscountSummary,
  getCartPaymentSummary,
  getDeliveryFeeAmount,
  getCartTotal,
  getCartTotalsByCurrency,
  getCartVariantCount,
  computeGiftCampaignPlans,
  reconcileGiftCartLines,
  updateCartLineQuantity,
} from "@/lib/storefront/cart";
import { useResolvedStorefrontTheme } from "@/lib/storefront/use-resolved-storefront-theme";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import { containsWholeWord, expandCategorySearchTerm } from "@/lib/search/turkish-search-aliases";
import { useStorefrontLocale, type TranslateFn } from "@/lib/storefront/locale-context";
import type { StorefrontTheme } from "@/lib/storefront/themes";
import { StorefrontLayoutProvider } from "@/lib/storefront/layout-context";
import {
  STOREFRONT_BANNER_SIZES,
  STOREFRONT_CROSS_SELL_SIZES,
  STOREFRONT_LOGO_SIZES,
  STOREFRONT_MODAL_PRODUCT_SIZES,
} from "@/lib/storefront/image-sizes";
import { getStorefrontSectionPath } from "@/lib/storefront/paths";
import {
  getRequestedUnitQuantity,
  type SalesUnit,
} from "@/lib/storefront/variants";
import type {
  BannerItem,
  CartItem,
  Category,
  InstallmentOption,
  StorefrontProduct,
  StorefrontSectionWithProducts,
  Tenant,
  TenantStorefrontSettings,
  TenantCampaign,
  HomepageBlockId,
} from "@/lib/types";
import { cn, formatCurrency, formatDateSlashTr } from "@/lib/utils";
import {
  startStorefrontHeartbeat,
  trackStorefrontCartAdd,
  trackStorefrontProductView,
  trackStorefrontSearch,
  trackStorefrontVisit,
} from "@/lib/storefront/analytics";
import { StorefrontCartDrawer } from "@/components/storefront/storefront-cart-drawer";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { StorefrontLogoutButton } from "@/components/storefront/storefront-logout-button";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { ProductDescriptionContent } from "@/components/storefront/product-description-content";
import {
  DiscountSticker,
  ProductPrice,
  StorefrontFloatingCartAction,
} from "@/components/storefront/storefront-product-card";
import { StorefrontProductListing } from "@/components/storefront/storefront-product-listing";
import {
  StorefrontCatalogContent,
  StorefrontCategoryDrawer,
  StorefrontCategorySidebar,
  StorefrontCategorySidebarSlot,
} from "@/components/storefront/storefront-category-sidebar";
import { getProductCardStyleClasses } from "@/lib/storefront/product-card-styles";
import {
  normalizeHomepageBlocks,
  isHomepageBlockVisible,
} from "@/lib/storefront/homepage-blocks";
import { StorefrontBottomNav } from "@/components/storefront/storefront-bottom-nav";
import { STOREFRONT_PRODUCT_SORTS, type StorefrontProductSort } from "@/lib/storefront/product-sort";
import { StorefrontCampaignsSheet } from "@/components/storefront/storefront-campaigns-sheet";
import { StorefrontSearchSheet } from "@/components/storefront/storefront-search-sheet";
import { isMarketOrTekelTenant } from "@/lib/storefront/white-label";
import { readTrackingPhone, saveTrackingPhone } from "@/lib/storefront/tracking-phone";
import { validateCustomerPhoneInput } from "@/lib/storefront/customer-phone";
import { StorefrontCouponBanner } from "@/components/storefront/storefront-coupon-banner";
import { BorderTrace, useCartAddFeedback } from "@/components/storefront/border-trace";
import type { StorefrontCoupon } from "@/lib/types";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontHeroBlock } from "@/components/storefront/storefront-hero-block";
import {
  StorefrontCategoryTiles,
  StorefrontHeroCluster,
  StorefrontPromoTiles,
} from "@/components/storefront/storefront-homepage-extras";
import { getStorefrontLayout } from "@/lib/storefront/layouts";
import { getNextOpening, isStoreOpenNow, type NextOpening } from "@/lib/storefront/business-hours";
import { StoreClosedOverlay } from "@/components/storefront/store-closed-overlay";

function getCartStorageKey(tenantId: string) {
  return `ekatalox_cart_${tenantId}`;
}

function getAnnouncementStorageKeys(tenantId: string) {
  return {
    version: `eKatalox_announcement_id_${tenantId}`,
    views: `eKatalox_announcement_views_${tenantId}`,
  };
}

type CampaignKind = "cash" | "card";
type CampaignSurface = "home" | "cart";

type CampaignDismissBySurface = {
  cash: { home: boolean; cart: boolean };
  card: { home: boolean; cart: boolean };
};

function getLegacyCampaignDismissKey(tenantId: string, kind: CampaignKind) {
  return `ekatalox_campaign_dismiss_${kind}_${tenantId}`;
}

function getCampaignDismissKey(
  tenantId: string,
  kind: CampaignKind,
  surface: CampaignSurface,
) {
  return `ekatalox_campaign_dismiss_${kind}_${tenantId}_${surface}`;
}

function isLegacyCampaignDismissed(tenantId: string, kind: CampaignKind): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(getLegacyCampaignDismissKey(tenantId, kind)) === "1";
}

function isCampaignDismissed(
  tenantId: string,
  kind: CampaignKind,
  surface: CampaignSurface,
): boolean {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(getCampaignDismissKey(tenantId, kind, surface)) === "1") {
    return true;
  }
  return isLegacyCampaignDismissed(tenantId, kind);
}

function dismissCampaign(tenantId: string, kind: CampaignKind, surface: CampaignSurface) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getCampaignDismissKey(tenantId, kind, surface), "1");
}

function readInitialCampaignDismissState(tenantId: string): CampaignDismissBySurface {
  if (typeof window === "undefined") {
    return {
      cash: { home: false, cart: false },
      card: { home: false, cart: false },
    };
  }

  return {
    cash: {
      home: isCampaignDismissed(tenantId, "cash", "home"),
      cart: isCampaignDismissed(tenantId, "cash", "cart"),
    },
    card: {
      home: isCampaignDismissed(tenantId, "card", "home"),
      cart: isCampaignDismissed(tenantId, "card", "cart"),
    },
  };
}

const announcementStorageEventName = "ekatalox:announcement-storage";

function subscribeToAnnouncementStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(announcementStorageEventName, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(announcementStorageEventName, handleChange);
  };
}

function notifyAnnouncementStorageChanged() {
  window.dispatchEvent(new Event(announcementStorageEventName));
}

function readStoredCounterValue(storageKey: string) {
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return 0;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const cartItem = item as Partial<CartItem>;

  return (
    typeof cartItem.id === "string" &&
    typeof cartItem.category_id === "string" &&
    typeof cartItem.product_name === "string" &&
    typeof cartItem.price === "number" &&
    typeof cartItem.currency === "string" &&
    typeof cartItem.is_in_stock === "boolean" &&
    typeof cartItem.quantity === "number" &&
    Number.isFinite(cartItem.quantity) &&
    cartItem.quantity > 0
  );
}

function readStoredCart(storageKey: string) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isValidCartItem)
      .map((item) => ({
        ...item,
        product_id: typeof item.product_id === "string" ? item.product_id : item.id,
        variant_id: typeof item.variant_id === "string" ? item.variant_id : null,
        variant_name: typeof item.variant_name === "string" ? item.variant_name : null,
        stock_quantity: typeof item.stock_quantity === "number" ? item.stock_quantity : null,
        sales_unit: "adet" as const,
        unit_quantity: item.quantity,
      }));
  } catch {
    return [];
  }
}

function addToCart(items: CartItem[], product: StorefrontProduct, quantity: number) {
  if (!product.is_in_stock || quantity <= 0) {
    return items;
  }

  const existing = items.find((item) => item.id === product.id);

  if (!existing) {
    return [
      ...items,
      {
        id: product.id,
        product_id: product.id,
        variant_id: null,
        variant_name: null,
        category_id: product.category_id,
        sku_code: product.sku_code,
        product_name: product.product_name,
        image_url: product.image_url,
        image_url_2: product.image_url_2,
        image_url_3: product.image_url_3,
        is_in_stock: product.is_in_stock,
        currency: product.currency,
        price: product.price,
        package_quantity: product.package_quantity,
        carton_quantity: product.carton_quantity,
        stock_quantity: product.stock_quantity,
        quantity,
        sales_unit: "adet" as const,
        unit_quantity: quantity,
      },
    ];
  }

  return items.map((item) =>
    item.id === product.id
      ? {
          ...item,
          quantity: item.quantity + quantity,
          sales_unit: "adet" as const,
          unit_quantity: item.quantity + quantity,
        }
      : item,
  );
}

function addVariantSelectionsToCart(
  items: CartItem[],
  product: StorefrontProduct,
  selections: VariantSelectionState[],
) {
  return selections.reduce((currentItems, selection) => {
    const variant = product.variants.find((item) => item.id === selection.variantId);

    if (!variant || !variant.is_purchasable) {
      return currentItems;
    }

    const requestedUnits = getRequestedUnitQuantity({
      unit: selection.unit,
      quantity: selection.quantity,
      variant,
    });

    if (requestedUnits <= 0) {
      return currentItems;
    }

    const existing = currentItems.find(
      (item) => item.product_id === product.id && item.variant_id === variant.id,
    );

    if (!existing) {
      return [
        ...currentItems,
        {
          id: `${product.id}:${variant.id}`,
          product_id: product.id,
          variant_id: variant.id,
          variant_name: variant.model_name,
          category_id: product.category_id,
          sku_code: product.sku_code,
          product_name: product.product_name,
          image_url: product.image_url,
          image_url_2: product.image_url_2,
          image_url_3: product.image_url_3,
          is_in_stock: product.is_in_stock && variant.is_purchasable,
          currency: product.currency,
          price: variant.price,
          package_quantity: variant.package_quantity,
          carton_quantity: variant.carton_quantity,
          stock_quantity: variant.stock_quantity,
          quantity: requestedUnits,
          sales_unit: "adet" as const,
          unit_quantity: requestedUnits,
        },
      ];
    }

    return currentItems.map((item) =>
      item.product_id === product.id && item.variant_id === variant.id
        ? {
            ...item,
            quantity: item.quantity + requestedUnits,
            sales_unit: "adet" as const,
            unit_quantity: item.quantity + requestedUnits,
          }
        : item,
    );
  }, items);
}

function getUnitSummary(product: StorefrontProduct, t: TranslateFn) {
  const parts: string[] = [];

  if (product.package_quantity) {
    parts.push(`${t("productModal.tabPackage")}: ${product.package_quantity} ${t("unit.piece")}`);
  }

  if (product.carton_quantity) {
    parts.push(`${t("productModal.tabCarton")}: ${product.carton_quantity} ${t("unit.piece")}`);
  }

  return parts.join("  ");
}

function parseUnitCount(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return 0;
  }

  const parsedValue = Number(normalized);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function QuantityStepper({
  value,
  onChange,
  disabled = false,
  placeholder = "0",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  function handleInputChange(raw: string) {
    if (raw === "") {
      onChange("");
      return;
    }

    if (/^\d+$/.test(raw)) {
      onChange(raw);
    }
  }

  function increment() {
    const current = parseUnitCount(value);
    if (current === null) {
      return;
    }
    onChange(String(current + 1));
  }

  function decrement() {
    const current = parseUnitCount(value);
    if (current === null) {
      return;
    }
    if (current <= 1) {
      onChange("");
    } else {
      onChange(String(current - 1));
    }
  }

  return (
    <div
      className={cn(
        theme.quantityStepper,
        disabled && "opacity-60",
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={disabled}
        value={value}
        onChange={(event) => handleInputChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? t("unit.piece")}
        className={cn(theme.quantityInput, "disabled:cursor-not-allowed")}
        style={{ fontSize: "16px" }}
      />
      <div className="flex shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={decrement}
          className={cn("flex w-8 items-center justify-center", theme.quantityStepperButton)}
          aria-label={t("cart.decreaseAria")}
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={increment}
          className={cn(
            "flex w-8 items-center justify-center",
            theme.quantityStepperButton,
          )}
          aria-label={t("cart.increaseAria")}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function normalizeVariantSearchText(value: string) {
  const normalized = value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

  return {
    spaced: normalized,
    compact: normalized.replace(/\s+/g, ""),
  };
}

function matchesVariantSearch(modelName: string, searchTerm: string) {
  const normalizedSearch = normalizeVariantSearchText(searchTerm);

  if (!normalizedSearch.spaced) {
    return true;
  }

  const normalizedModelName = normalizeVariantSearchText(modelName);

  return (
    normalizedModelName.spaced.includes(normalizedSearch.spaced) ||
    normalizedModelName.compact.includes(normalizedSearch.compact)
  );
}

function dedupeProducts(items: StorefrontProduct[]) {
  const seen = new Set<string>();

  return items.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }

    seen.add(product.id);
    return true;
  });
}

// Sepet önerilerini bir oturum tohumuna göre sıralamak için saf bir hash —
// böylece ürün, sekme kapanana kadar aynı (kararlı) ama sayfa her
// yenilendiğinde farklı bir sırada gösteriliyor. Ref/mutasyon kullanmıyor
// (render sırasında ref erişimi React Compiler tarafından yasak).
function hashStringToUnitInterval(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return (hash >>> 0) / 0xffffffff;
}

// Çapraz satış kartında "Getir tarzı" ekleme geri bildirimi: ana karttaki
// BorderTrace çizgisinin küçük hali. Hook per-kart çalışsın diye ayrı bileşen.
function CrossSellCardFx({
  quantity,
  sparkleClassName,
  radius = 16,
  children,
}: {
  quantity: number;
  sparkleClassName?: string;
  radius?: number;
  children: React.ReactNode;
}) {
  const { imagePulse, traceRef, initiallyInCart } = useCartAddFeedback(quantity);
  // Çizgi kartın tamamını dolanır (sabit); eklemede ÜRÜN GÖRSELİ pulse yapar.
  return (
    <>
      <span className="pointer-events-none absolute inset-0 z-20">
        <BorderTrace ref={traceRef} defaultVisible={initiallyInCart} className={sparkleClassName} radius={radius} />
      </span>
      <motion.div animate={imagePulse}>{children}</motion.div>
    </>
  );
}

function shuffleProductsBySeed(items: StorefrontProduct[], seed: string) {
  return [...items].sort(
    (a, b) =>
      hashStringToUnitInterval(a.id + seed) - hashStringToUnitInterval(b.id + seed),
  );
}


function subscribeToMountState() {
  return () => {};
}

function getClientMountedState() {
  return true;
}

function getServerMountedState() {
  return false;
}

function renderBannerItem(
  banner: BannerItem,
  index: number,
  title: string,
  theme: StorefrontTheme,
  t: TranslateFn,
  // Market/tekel vitrinlerinde mobilde banner daha dolgun görünsün diye
  // 3:1 yerine 5:2 (kullanıcı isteği, 21 Ağu 2026: "yukarı doğru
  // genişlesin"). Görsel object-cover ile yerleştiği için kutu uzayınca
  // sol/sağ kenarlardan ~%17 kırpılıyor — bilinçli tercih.
  tallOnMobile = false,
) {
  const href = banner.cta_href?.trim() || null;
  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      key={banner.id}
      {...(href ? { href } : {})}
      className={cn(
        "relative block w-full overflow-hidden rounded-[2.5rem]",
        theme.border,
        theme.surface,
        theme.elevation1,
        theme.surfaceRing,
      )}
      style={{
        background:
          banner.background_color ??
          (index % 2 === 0
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #065f46 0%, #10b981 100%)"),
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          theme.bannerOverlay,
          "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%)]",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          theme.bannerOverlay,
          "bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_60%)]",
        )}
      />
      <div
        className={cn(
          "relative bg-transparent",
          tallOnMobile ? "aspect-[5/2] sm:aspect-[3/1]" : "aspect-[3/1]",
        )}
      >
        {banner.image_url ? (
          <StorefrontImage
            src={banner.image_url}
            alt={banner.title ?? `${title} banner`}
            className="object-cover object-center"
            sizes={STOREFRONT_BANNER_SIZES}
            priority
          />
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center p-8 text-center text-white/70 sm:min-h-[220px] md:min-h-[340px] lg:min-h-[400px]">
            <div>
              <p className="text-lg font-semibold sm:text-xl">{t("catalog.bannerImageMissing")}</p>
              <p className="mt-2 text-sm leading-6 sm:text-base">
                {t("catalog.bannerImageMissingHint")}
              </p>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

type ProductDetailTab = "details" | "package" | "carton";

interface VariantSelectionState {
  variantId: string;
  unit: SalesUnit;
  quantity: number;
}

interface ActiveAnnouncement {
  title: string;
  body: string;
  version: number;
  maxDisplayCount: number;
}

function AnnouncementModal({
  announcement,
  onDismiss,
  badgeLabel,
}: {
  announcement: ActiveAnnouncement;
  onDismiss: () => void;
  // Yoğunluk modu aynı modalı kullanıyor ama "Yeni Duyuru" rozeti oraya
  // uymuyor; verilmezse duyuru metni kullanılır.
  badgeLabel?: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [isOpen, setIsOpen] = useState(true);

  function handleDismiss() {
    setIsOpen(false);
    onDismiss();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label={t("announcement.closeAria")}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] shadow-[0_36px_120px_rgba(15,23,42,0.30)] backdrop-blur-2xl",
              theme.border,
              theme.surface,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            aria-describedby="announcement-modal-body"
          >
            <div className="absolute inset-0 overflow-hidden">
              {/* Renkler temadan geliyor; eskiden emerald/cyan/sky sabit
                  kodluydu ve her vitrinde aynı görünüyordu. İki dekoratif
                  blur-3xl daire de kaldırıldı — hem sabit renkliydiler hem
                  iOS Safari'de gereksiz filtre yüküydüler. */}
              <div className={cn("absolute inset-x-0 top-0 h-28", theme.surfaceMuted)} />
            </div>

            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl", theme.surfaceMuted, theme.productPrice)}>
                    <Megaphone className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <span className={cn(theme.stockBadgeIn, "uppercase tracking-[0.22em] text-[11px]")}>
                      {badgeLabel ?? t("announcement.badge")}
                    </span>
                    <h2
                      id="announcement-modal-title"
                      className={cn("text-2xl font-black tracking-tight sm:text-[2.2rem]", theme.text)}
                    >
                      {announcement.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className={theme.modalCloseButton}
                  aria-label={t("common.close")}
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className={cn("mt-6 p-5 sm:p-6", theme.modalSurface)}>
                <div className={cn("mb-4 h-px w-full", theme.surfaceMuted)} />
                <p
                  id="announcement-modal-body"
                  className={cn("whitespace-pre-line text-[15px] leading-8 sm:text-base", theme.textMuted)}
                >
                  {announcement.body}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={handleDismiss}
                  className={cn(
                    "h-12 rounded-full px-7 text-sm font-semibold transition hover:scale-[1.01]",
                    theme.primaryButton,
                  )}
                >
                  {t("announcement.acknowledge")}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function getAnnouncementVisibility(params: {
  activeAnnouncement: ActiveAnnouncement | null;
  storageKeys: ReturnType<typeof getAnnouncementStorageKeys>;
}) {
  if (typeof window === "undefined") {
    return false;
  }

  if (!params.activeAnnouncement) {
    return false;
  }

  const storedVersion = readStoredCounterValue(params.storageKeys.version);

  if (storedVersion !== params.activeAnnouncement.version) {
    return true;
  }

  const storedViews = readStoredCounterValue(params.storageKeys.views);

  return storedViews < params.activeAnnouncement.maxDisplayCount;
}

const salesUnits: Array<{ value: SalesUnit }> = [
  { value: "adet" },
  { value: "paket" },
  { value: "koli" },
];

export function StorefrontClient({
  tenant,
  categories,
  initialProducts,
  initialProductTotal,
  campaigns = [],
  promoProducts,
  promoProductCount = 0,
  bestSellerProducts,
  recommendationPool,
  categoryRepresentativeImages = {},
  storefrontSettings,
  sections = [],
  subdomain,
  pageTitle,
  homeHref,
  hasPageFooter = false,
  isCatalogOnly = false,
  sectionMode = false,
}: {
  tenant: Tenant;
  categories: Category[];
  initialProducts: StorefrontProduct[];
  initialProductTotal: number;
  campaigns?: TenantCampaign[];
  promoProducts: StorefrontProduct[];
  promoProductCount?: number;
  bestSellerProducts: StorefrontProduct[];
  recommendationPool: StorefrontProduct[];
  // Anasayfada henüz yüklenmemiş ürünlerin de kategori kutucuğunda temsilci
  // görsel olarak kullanılabilmesi için sunucu tarafında ayrıca çekilen,
  // kategori id -> ürün image_url haritası (bkz. lib/data.ts
  // getStorefrontCategoryRepresentativeImages). Bölüm sayfası (section
  // page) kategori kutucuğu göstermediği için bu prop'u geçmiyor.
  categoryRepresentativeImages?: Record<string, string>;
  storefrontSettings: TenantStorefrontSettings;
  sections?: StorefrontSectionWithProducts[];
  subdomain?: string;
  pageTitle?: string;
  homeHref?: string;
  hasPageFooter?: boolean;
  isCatalogOnly?: boolean;
  // Küratörlü bölüm sayfası (bkz. app/store/[subdomain]/section/[sectionId])
  // her zaman zaten küçük, sabit bir ürün listesiyle çalışır — burada arama/
  // kategori filtresi /api/storefront/products'a (tüm katalog) gitmemeli,
  // sadece initialProducts üzerinde istemci taraflı filtrelenmeli.
  sectionMode?: boolean;
}) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return readStoredCart(getCartStorageKey(tenant.id));
  });
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isStickyCartBarDismissed, setIsStickyCartBarDismissed] = useState(false);
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [isCampaignsSheetOpen, setIsCampaignsSheetOpen] = useState(false);
  // Müşteriye özel kupon (telefona bağlı). Sepette numara yazılınca lookup'tan
  // gelir; sayfa açılışında cihazda kayıtlı numara (önceki sipariş) varsa
  // sessizce bulunur ve üst şeritte duyurulur.
  const [customerCoupon, setCustomerCoupon] = useState<StorefrontCoupon | null>(null);
  const [note, setNote] = useState("");
  const [customerReferenceName, setCustomerReferenceName] = useState("");
  const [customerReferenceNameError, setCustomerReferenceNameError] = useState<string | null>(
    null,
  );
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerAddressError, setCustomerAddressError] = useState<string | null>(null);
  // Anlık konum paylaşımı isteğe bağlı: müşteri siparişi başka bir yerden
  // veriyor olabilir (ör. dışarıdayken eve sipariş). Bu yüzden varsayılan
  // kapalı ve adres alanı zorunlu kalmaya devam ediyor.
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Katalog sıralaması — yalnız toptancı (market olmayan) vitrinlerinde
  // gösterilir; SSR ilk sayfa "featured" gelir, değişince 1. sayfa yeniden
  // çekilir (kullanıcı isteği, 6 Eyl 2026).
  const [productSort, setProductSort] = useState<StorefrontProductSort>("featured");
  const [shareLocation, setShareLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "denied" | "error">("idle");
  // Devam eden konum isteği: müşteri kutuyu işaretleyip HEMEN siparişi
  // gönderirse koordinat henüz gelmemiş oluyordu ve konum satırı sessizce
  // düşüyordu. Gönderim anında bu sözü bekliyoruz.
  const locationPromiseRef = useRef<Promise<{ lat: number; lng: number } | null> | null>(null);
  // Sipariş gönderen useCallback'in bağımlılıklarında konum yoktu; fonksiyon
  // yeniden oluşmadığı için state güncellense bile ESKİ (boş) değeri
  // okuyordu ve mesaja konum satırı düşmüyordu. Bağımlılık eklemek yerine
  // referanstan okuyoruz: bu, aynı hatanın tekrar oluşmasını imkânsız kılar.
  const customerLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const shareLocationRef = useRef(false);

  const fetchCustomerLocation = useCallback(() => {
    // TEK çağrı, tek zaman aşımı. Daha önce "sağlamlaştırma" adına iki
    // aşamalı yapılmıştı (önce hızlı yöntem, olmazsa GPS); 8 saniyelik ilk
    // sınır kullanıcı izin penceresini okurken doluyor, kod ikinci bir
    // konum isteği yapıyor ve iOS ilk pencere hâlâ açıkken gelen bu isteği
    // anında reddediyordu — sonuç "izin verilmedi" oluyordu. İzin istemi
    // beklerken ASLA ikinci istek yapma.
    const pending = new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          };
          customerLocationRef.current = coords;
          setCustomerLocation(coords);
          setLocationStatus("idle");
          resolve(coords);
        },
        (error) => {
          customerLocationRef.current = null;
          setCustomerLocation(null);
          setLocationStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
          resolve(null);
        },
        // enableHighAccuracy KAPALI: true, telefonu GPS'i uyandırmaya zorluyor
        // ve bina içinde 12 saniyeyi rahat aşıyordu — iki telefondan birinde
        // konumun gelmemesinin sebebi buydu. Wi-Fi/baz istasyonu konumu
        // genelde 1-2 saniyede dönüyor ve 20-50 m isabetli; adres alanı
        // zaten zorunlu olduğu için bu fazlasıyla yeterli.
        // Zaman aşımı uzun tutuldu ki kullanıcı izin penceresini okurken
        // dolmasın. Tek çağrı: izin istemi açıkken ASLA ikinci istek yok.
        { enableHighAccuracy: false, timeout: 25_000, maximumAge: 60_000 },
      );
    });

    locationPromiseRef.current = pending;
    return pending;
  }, []);

  const toggleShareLocation = useCallback(() => {
    const next = !shareLocation;
    shareLocationRef.current = next;
    setShareLocation(next);

    if (!next) {
      customerLocationRef.current = null;
      setCustomerLocation(null);
      setLocationStatus("idle");
      locationPromiseRef.current = null;
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    void fetchCustomerLocation();
  }, [fetchCustomerLocation, shareLocation]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhoneError, setCustomerPhoneError] = useState<string | null>(null);
  // "Market" tipi tenant'larda sipariş verebilmek için ödeme yöntemi, müşteri
  // adı, adresi ve telefonu zorunlu tutulur — teslimat yapan tekel/marketlerin
  // WhatsApp mesajında bu bilgiler olmadan sipariş alması istenmiyor.
  const isMarketTenant = tenant.business_type === "market";
  // Alkol/sigara bayii (tekel) — yasal olarak dağıtım/teslimat yapamaz.
  // true iken adres toplanmaz, sepet/checkout metinleri "sipariş listesi
  // hazırlama" diline döner (kullanıcı isteği, 20 Ağu 2026).
  const isTekel = tenant.is_tekel;
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<StorefrontProduct | null>(null);
  // null = hiçbir sekme açık değil (varsayılan) — Detaylar/Paket/Koli metni
  // sadece kullanıcı ilgili butona tıklayınca görünür, aksi halde ürün
  // önizleme modalı sekme butonlarının hemen altına ilgili ürünler bölümüne
  // geçer, ekstra kaydırma çubuğu gerekmez (kullanıcı isteği, 19 Ağu 2026).
  const [activePreviewTab, setActivePreviewTab] = useState<ProductDetailTab | null>(null);
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);
  const relatedPreviewScrollRef = useRef<HTMLDivElement>(null);

  function scrollRelatedPreview(direction: "left" | "right") {
    const container = relatedPreviewScrollRef.current;
    if (!container) return;
    const amount = Math.round(container.clientWidth * 0.8) * (direction === "left" ? -1 : 1);
    container.scrollBy({ left: amount, behavior: "smooth" });
  }
  const [previewDescription, setPreviewDescription] = useState<string | null | undefined>(
    undefined,
  );
  const [previewDescriptionLoading, setPreviewDescriptionLoading] = useState(false);
  const [previewDescriptionError, setPreviewDescriptionError] = useState<string | null>(null);
  const descriptionCacheRef = useRef(new Map<string, string | null>());
  const descriptionAbortRef = useRef<AbortController | null>(null);
  const [relatedPreviewProducts, setRelatedPreviewProducts] = useState<StorefrontProduct[]>([]);
  // "Yanında iyi gider" (kategori eşlemeleri, bkz. category_pairings):
  // sepetteki ürünlerin tamamlayıcıları (buz, kola, çerez…) ve ürün
  // penceresindeki ikinci şerit buradan beslenir.
  const [pairings, setPairings] = useState<Array<{ source_category_id: string; target_category_id: string; priority: number }>>([]);
  const [complementProducts, setComplementProducts] = useState<StorefrontProduct[]>([]);
  const [pairPreviewProducts, setPairPreviewProducts] = useState<StorefrontProduct[]>([]);
  // Sepet çekmecesinin 2. adımı ("bunları unutmuş olabilirsiniz") listesi o
  // adıma geçilirken burada DONDURULUR. Hem listenin sepet değiştikçe yeniden
  // hesaplanıp kartların kaybolmasını önler, hem de bu ürünler productsById'ye
  // eklenir — yoksa "+" tıklaması sessizce hiçbir şey yapmıyordu (ürün ana
  // katalogda yüklü değilse handleQuickAddOrOpenModal erken return ediyor).
  const [cartSuggestionsSnapshot, setCartSuggestionsSnapshot] = useState<StorefrontProduct[]>([]);
  // "N al Y hediye" kampanyalarının tetikleyici/hediye ürünleri (market/tekel
  // sadece) — sayfada hiç yüklü olmayabilirler, id ile ayrıca çözülür (bkz.
  // productsById ve reconcileGiftCartLines effect'i).
  const [giftCampaignProducts, setGiftCampaignProducts] = useState<StorefrontProduct[]>([]);
  const pairFetchCacheRef = useRef(new Map<string, StorefrontProduct[]>());
  const relatedPreviewCacheRef = useRef(new Map<string, StorefrontProduct[]>());
  const relatedPreviewAbortRef = useRef<AbortController | null>(null);
  const [recommendationSeed] = useState(() => Math.random().toString(36));
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [selectedPackageCount, setSelectedPackageCount] = useState("");
  const [selectedCartonCount, setSelectedCartonCount] = useState("");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [variantSelections, setVariantSelections] = useState<VariantSelectionState[]>([]);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  // Katalog artık sunucu taraflı sayfalanıyor (arama/kategori/"Devamını
  // Göster" hepsi /api/storefront/products'a gidiyor) — büyük kataloglarda
  // (20k+ ürün) tüm listeyi tek seferde istemciye gönderip orada filtrelemek
  // sayfayı ~16MB'a çıkarıp her ziyaretçi için saniyeler süren yüklemeye yol
  // açıyordu. `products` burada "şu ana kadar yüklenen" birikimli listedir;
  // arama/kategori değişince sıfırlanır, "Devamını Göster" ile büyür.
  const [products, setProducts] = useState<StorefrontProduct[]>(initialProducts);
  const [productTotal, setProductTotal] = useState(initialProductTotal);
  const [productPage, setProductPage] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const isFirstProductFetch = useRef(true);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  // Mobilde banner'lar elle kaydırılabiliyor (scroll-snap şeridi).
  const bannerScrollRef = useRef<HTMLDivElement | null>(null);
  // Kullanıcı kaydırdıktan sonra otomatik geçiş bir süre susar; aksi
  // halde banner bakarken elinin altından kayıyor.
  const bannerInteractionRef = useRef(0);
  // Kendi yaptığımız kaydırmaların onScroll'u tetiklemesini ayırt etmek
  // için: smooth scroll ara pozisyonlar üretiyor, bunlar index'i geri
  // alıp animasyonu iptal edebiliyor.
  const bannerProgrammaticRef = useRef(false);
  // Kaydırma durdu mu? Sabit süreli timeout yetmiyor — smooth scroll
  // beklenenden uzun sürüp bayrağı erken temizleyince kalan olaylar
  // "kullanıcı kaydırdı" sanılıyor ve otomatik geçiş kadansı bozuluyor.
  const bannerScrollEndTimerRef = useRef<number | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Sayfa sunucuda render edildiğinde mağaza açıktı (kapalıysa page.tsx zaten
  // StoreOutsideHoursNotice döndürüp bu bileşeni hiç render etmez). Belirli
  // saatler ayarlıysa, sekme açık kalırken kapanış saati gelirse müşteriye
  // haber vermek için burada da periyodik kontrol yapılır.
  const [isClosedNow, setIsClosedNow] = useState(false);
  const [closedNowNextOpening, setClosedNowNextOpening] = useState<NextOpening | null>(null);

  useEffect(() => {
    if (storefrontSettings.is_always_open) {
      return;
    }

    const checkStoreHours = () => {
      if (!isStoreOpenNow(storefrontSettings)) {
        setIsClosedNow(true);
        setClosedNowNextOpening(getNextOpening(storefrontSettings));
      }
    };

    checkStoreHours();
    const intervalId = window.setInterval(checkStoreHours, 60_000);
    document.addEventListener("visibilitychange", checkStoreHours);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkStoreHours);
    };
  }, [storefrontSettings]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | null>(null);
  const [selectedInstallmentCount, setSelectedInstallmentCount] = useState<number | null>(null);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  const [isGeneratingOrderPdf, setIsGeneratingOrderPdf] = useState(false);
  const [orderPdfError, setOrderPdfError] = useState<string | null>(null);
  // "Siparişi Ver"e eksik alanla her basışta artar — sepet çekmecesi ilk eksik
  // zorunlu alana yeniden kaysın diye (aynı hata tekrar set edilince re-render
  // olmayabiliyor).
  const [checkoutValidationNonce, setCheckoutValidationNonce] = useState(0);
  const [whatsappHandoff, setWhatsappHandoff] = useState<WhatsAppOrderHandoff | null>(null);
  const [campaignDismissState, setCampaignDismissState] = useState<CampaignDismissBySurface>(
    () => readInitialCampaignDismissState(tenant.id),
  );
  const isMounted = useSyncExternalStore(
    subscribeToMountState,
    getClientMountedState,
    getServerMountedState,
  );
  const analyticsSubdomain = subdomain ?? tenant.subdomain;
  const { t } = useStorefrontLocale();

  // Daha önce sipariş vermiş bir müşteri telefon numarasını tekrar
  // yazdığında isim/adresi otomatik doldurur (bkz. /api/storefront/customer-lookup).
  // Sadece market tenant'larda ve sadece boş alanlar doldurulur — müşteri
  // manuel bir şey yazdıysa üzerine yazılmaz.
  const debouncedCustomerPhoneForLookup = useDebouncedValue(customerPhone, 500);
  const lastLookedUpPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMarketTenant) {
      return;
    }

    const trimmedPhone = debouncedCustomerPhoneForLookup.trim();
    if (trimmedPhone.replace(/\D/g, "").length < 10) {
      return;
    }

    if (lastLookedUpPhoneRef.current === trimmedPhone) {
      return;
    }
    lastLookedUpPhoneRef.current = trimmedPhone;

    const controller = new AbortController();

    fetch(
      `/api/storefront/customer-lookup?subdomain=${encodeURIComponent(analyticsSubdomain)}&phone=${encodeURIComponent(trimmedPhone)}`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { customer?: { full_name: string; address: string } | null; coupon?: StorefrontCoupon | null } | null) => {
        setCustomerCoupon(data?.coupon ?? null);
        const customer = data?.customer;
        if (!customer) {
          return;
        }

        setCustomerReferenceName((current) => (current.trim() ? current : customer.full_name));
        setCustomerAddress((current) => (current.trim() ? current : customer.address));
      })
      .catch(() => {
        // Autofill best-effort; sessizce yut.
      });

    return () => controller.abort();
  }, [debouncedCustomerPhoneForLookup, isMarketTenant, analyticsSubdomain]);

  // Telefon cihazda hatırlanır: sayfa yenilenince sepet formu boş kalmasın.
  // Ad/adres zaten numaradan otomatik dolduğu için tek başına yeterli.
  useEffect(() => {
    if (!isMarketTenant) return;
    const saved = readTrackingPhone();
    if (saved) setCustomerPhone((current) => (current.trim() ? current : saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarketTenant]);

  useEffect(() => {
    if (!isMarketTenant) return;
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length >= 10) saveTrackingPhone(customerPhone);
  }, [customerPhone, isMarketTenant]);

  useEffect(() => {
    if (!isMarketTenant) return;
    const saved = readTrackingPhone();
    if (!saved || saved.replace(/\D/g, "").length < 10) return;
    const controller = new AbortController();
    fetch(
      `/api/storefront/customer-lookup?subdomain=${encodeURIComponent(analyticsSubdomain)}&phone=${encodeURIComponent(saved)}`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { coupon?: StorefrontCoupon | null } | null) => {
        if (data?.coupon) setCustomerCoupon(data.coupon);
      })
      .catch(() => undefined);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarketTenant, analyticsSubdomain]);

  useEffect(() => {
    if (!isMarketOrTekelTenant(tenant)) return;
    const controller = new AbortController();
    fetch(`/api/storefront/pairings?subdomain=${encodeURIComponent(analyticsSubdomain)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.pairings)) setPairings(d.pairings); })
      .catch(() => undefined);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsSubdomain]);

  // Bir kategorinin (soyu dahil) eşlenmiş hedef kategorileri, öncelik sırasıyla
  const getPairingTargets = useCallback((categoryId: string | null | undefined) => {
    if (!categoryId || !pairings.length) return [] as Array<{ id: string; priority: number }>;
    const lineageIds = new Set(getCategoryLineage(categories, categoryId).map((c) => c.id));
    lineageIds.add(categoryId);
    return pairings
      .filter((pr) => lineageIds.has(pr.source_category_id))
      .map((pr) => ({ id: pr.target_category_id, priority: pr.priority }));
  }, [pairings, categories]);

  // Sepete göre EKSİK tamamlayıcı kategoriler (sepette o kategoriden ürün varsa önerilmez)
  const missingComplementCategoryIds = useMemo(() => {
    if (!pairings.length || !cart.length) return [] as string[];
    const cartCategorySet = new Set<string>();
    for (const item of cart) {
      if (!item.category_id) continue;
      cartCategorySet.add(item.category_id);
      for (const c of getCategoryLineage(categories, item.category_id)) cartCategorySet.add(c.id);
    }
    const scored = new Map<string, number>();
    for (const item of cart) {
      for (const target of getPairingTargets(item.category_id)) {
        const expanded = [target.id, ...getDescendantCategoryIds(categories, target.id)];
        if (expanded.some((id) => cartCategorySet.has(id))) continue; // zaten sepette
        scored.set(target.id, Math.min(scored.get(target.id) ?? 999, target.priority));
      }
    }
    return [...scored.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id);
  }, [cart, pairings, categories, getPairingTargets]);

  // Her HEDEF kategoriden ayrı çekilir ve öncelik sırasıyla 2'şer ürün
  // serpiştirilir — tek sorguda karıştırınca ilk kategoriler (içecekler)
  // tüm listeyi kaplıyor, çerez/çikolata/bardak hiç görünmüyordu (2 Eyl 2026).
  const fetchPairProducts = useCallback(async (categoryIds: string[], excludeIds: Set<string>) => {
    if (!subdomain || !categoryIds.length) return [] as StorefrontProduct[];
    const perCategory = await Promise.all(
      categoryIds.map(async (catId) => {
        const expanded = [catId, ...getDescendantCategoryIds(categories, catId)];
        const cacheKey = expanded.slice().sort().join(",");
        let list = pairFetchCacheRef.current.get(cacheKey);
        if (!list) {
          try {
            const params = new URLSearchParams({ subdomain, categoryIds: expanded.join(","), page: "1" });
            const response = await fetch(`/api/storefront/products?${params.toString()}`);
            if (!response.ok) return [] as StorefrontProduct[];
            const result = await response.json();
            list = Array.isArray(result.products) ? (result.products as StorefrontProduct[]) : [];
            pairFetchCacheRef.current.set(cacheKey, list);
          } catch {
            return [] as StorefrontProduct[];
          }
        }
        return shuffleProductsBySeed(
          list.filter((productItem) => productItem.is_in_stock && !excludeIds.has(productItem.id)),
          recommendationSeed,
        );
      }),
    );
    // 1. tur: ürünü olan HER kategoriden mutlaka 1 ürün (kategori atlanmaz);
    // 2. tur: yer kaldıkça her kategoriden 2.; 3. tur: kalan boşluk sırayla.
    const seen = new Set<string>();
    const pick: StorefrontProduct[] = [];
    const LIMIT = Math.max(16, perCategory.length);
    for (const perPass of [1, 2, 10] as const) {
      for (const list of perCategory) {
        let taken = list.filter((x) => seen.has(x.id)).length;
        for (const productItem of list) {
          if (seen.has(productItem.id)) continue;
          if (taken >= perPass) break;
          if (perPass > 1 && pick.length >= LIMIT) break;
          seen.add(productItem.id);
          pick.push(productItem);
          taken += 1;
        }
      }
      if (pick.length >= LIMIT) break;
    }
    return pick;
  }, [categories, subdomain, recommendationSeed]);

  // Sepetin eksik tamamlayıcıları (ilk 3 kategori, 10 ürün)
  useEffect(() => {
    if (!missingComplementCategoryIds.length) { setComplementProducts([]); return; }
    let cancelled = false;
    const cartIds = new Set(cart.map((item) => item.product_id).filter(Boolean) as string[]);
    void fetchPairProducts(missingComplementCategoryIds, cartIds).then((list) => {
      if (!cancelled) setComplementProducts(list.slice(0, 16));
    });
    return () => { cancelled = true; };
  }, [missingComplementCategoryIds, fetchPairProducts, cart]);

  // Ürün penceresi: "Yanında iyi gider" şeridi (sepetten bağımsız)
  useEffect(() => {
    if (!previewProduct) { setPairPreviewProducts([]); return; }
    const targets = getPairingTargets(previewProduct.category_id).sort((a, b) => a.priority - b.priority);
    if (!targets.length) { setPairPreviewProducts([]); return; }
    let cancelled = false;
    void fetchPairProducts(targets.map((x) => x.id), new Set([previewProduct.id])).then((list) => {
      if (!cancelled) setPairPreviewProducts(list.slice(0, 16));
    });
    return () => { cancelled = true; };
  }, [previewProduct, getPairingTargets, fetchPairProducts]);

  const theme = useResolvedStorefrontTheme(
    storefrontSettings.theme_key,
    {
      brand_primary_color: storefrontSettings.brand_primary_color,
      brand_accent_color: storefrontSettings.brand_accent_color,
    },
    storefrontSettings.product_image_background,
  );
  const layout = getStorefrontLayout(storefrontSettings.layout_key ?? "classic-grid");
  const productCardStyle = getProductCardStyleClasses(storefrontSettings.product_card_style);
  // Market/tekel bayilerde MOBİLDE düzen: banner -> indirimli ürün şeridi ->
  // kategori görselleri. Varsayılan sırada kategoriler ve indirimliler
  // banner'ın ÜSTÜNDE (bkz. DEFAULT_HOMEPAGE_BLOCKS). Sıralamayı CSS order
  // ile değil dizi üzerinde yapıyoruz: blokların kapsayıcısı düz bir div,
  // flex'e çevirmek tüm vitrinlerde yerleşimi etkilerdi.
  // "Tümü (N)" bunun üzerine gidiyor. Kategori ya tenant'ta gerçek bir satır
  // (is_discount_category) ya da page.tsx'in indirimli ürün varken listeye
  // eklediği "virtual-discount-category" satırı.
  const discountCategoryId = useMemo(
    () => categories.find((category) => category.is_discount_category)?.id ?? null,
    [categories],
  );

  const usesMarketMobileOrder = isMobileViewport && isMarketOrTekelTenant(tenant);
  // Sabit alt navigasyon (Ara / Kategoriler / Sepet) — mobil anasayfa
  // sıralamasıyla aynı kapı: market veya tekel bayii + mobil.
  const usesBottomNav = usesMarketMobileOrder;

  // Market/tekel bayilerinde masaüstü sıralaması da sabit: kategori menüsünün
  // altında banner, onun altında kategori kutucukları, sonra indirimli ürünler,
  // en sonda vitrin bölümleri (çok satanlar). Mobildeki sıradan farkı,
  // kategori kutucuklarının indirimlilerden ÖNCE gelmesi — geniş ekranda
  // müşteri önce nereye bakacağını seçiyor, mobilde ise fırsatı görüyor.
  const usesMarketDesktopOrder = !isMobileViewport && isMarketOrTekelTenant(tenant);

  const homepageBlocks = useMemo(() => {
    const base = normalizeHomepageBlocks(storefrontSettings.homepage_blocks);
    if (!usesMarketMobileOrder && !usesMarketDesktopOrder) return base;

    // Grup, bu dört bloktan en üstte duranın yerine oturur; böylece bayinin
    // kendi blok sıralamasında nereye koyduysa oraya yerleşir, sadece kendi
    // aralarındaki sıra sabitlenir.
    const groupIds: HomepageBlockId[] = usesMarketMobileOrder
      ? ["banner", "promoTiles", "categoryTiles"]
      : ["banner", "categoryTiles", "promoTiles", "showcase"];
    const anchor = Math.min(
      ...groupIds
        .map((id) => base.find((block) => block.id === id)?.order)
        .filter((order): order is number => order !== undefined),
    );
    if (!Number.isFinite(anchor)) return base;

    return base
      .map((block) => {
        const index = groupIds.indexOf(block.id);
        return index === -1 ? block : { ...block, order: anchor + index * 0.1 };
      })
      .sort((left, right) => left.order - right.order);
  }, [storefrontSettings.homepage_blocks, usesMarketMobileOrder, usesMarketDesktopOrder]);
  const usesSidebarNav = layout.categoryNav === "sidebar";
  const cartStorageKey = useMemo(() => getCartStorageKey(tenant.id), [tenant.id]);
  const announcementStorageKeys = useMemo(
    () => getAnnouncementStorageKeys(tenant.id),
    [tenant.id],
  );
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const topCategories = categoryTree;
  const selectedCategoryIds = useMemo(() => {
    if (selectedCategoryId === "all") {
      return null;
    }

    return new Set(getDescendantCategoryIds(categories, selectedCategoryId));
  }, [categories, selectedCategoryId]);
  // "İndirimli Ürünler" gibi bir kategori is_discount_category=true ise,
  // kategoriye elle atanmış ürünler yerine mağazadaki gerçekten indirimde
  // olan TÜM ürünler otomatik listelenir.
  const isDiscountCategorySelected = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId)?.is_discount_category ?? false,
    [categories, selectedCategoryId],
  );
  // Arama artık sunucuda çalışıyor — kategori adı eşleşmesini de arama
  // sorgusuna dahil etmek için (ör. "bira" yazınca "Biralar" kategorisindeki
  // ürünlerin de gelmesi) isim eşleşen kategori id'lerini burada, elimizdeki
  // kategori listesinden çıkarıp API'ye ayrıca gönderiyoruz. Ürünler ağacın
  // yaprak (en alt) kategorilerine bağlı olduğundan, sadece adı eşleşen
  // kategorinin kendi id'sini değil TÜM alt kategorilerini de dahil ediyoruz
  // — yoksa ör. "meyve" araması "Meyve & Sebze" ana kategorisini bulur ama
  // ürünlerin asıl bağlı olduğu "Elma"/"Domates" gibi alt kategorileri hiç
  // kapsamaz. "çerez" gibi kategori adında hiç geçmeyen argo terimler için
  // de expandCategorySearchTerm ile eşanlamlı genişletme uygulanıyor.
  const matchCategoryIds = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLocaleLowerCase("tr-TR");
    if (!normalizedSearch) {
      return [] as string[];
    }
    const searchTerms = expandCategorySearchTerm(normalizedSearch);
    const matchedRootIds = categories
      .filter((category) => searchTerms.some((term) => containsWholeWord(category.name, term)))
      .map((category) => category.id);
    return [...new Set(matchedRootIds.flatMap((id) => getDescendantCategoryIds(categories, id)))];
  }, [categories, debouncedSearchTerm]);
  const selectedCategoryLineage = useMemo(
    () =>
      selectedCategoryId === "all" ? [] : getCategoryLineage(categories, selectedCategoryId),
    [categories, selectedCategoryId],
  );
  const selectedTopCategoryId = selectedCategoryLineage[0]?.id ?? "all";
  const selectedTopCategory = useMemo(
    () => topCategories.find((category) => category.id === selectedTopCategoryId) ?? null,
    [selectedTopCategoryId, topCategories],
  );
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategoryId === "all") {
      return t("header.allProducts");
    }

    return (
      selectedCategoryLineage.map((category) => category.name).join(" › ") ||
      categoryNameMap.get(selectedCategoryId) ||
      t("catalog.products")
    );
  }, [categoryNameMap, selectedCategoryId, selectedCategoryLineage, t]);
  const mobileSubcategories = useMemo(() => {
    if (!selectedTopCategory) {
      return [];
    }

    return selectedTopCategory.children.map((child) => ({
      id: child.id,
      name: child.name,
    }));
  }, [selectedTopCategory]);
  // 3. seviye alt kategoriler (ör. Alkol > Biralar > Efes) — sadece mobilde,
  // 2. seviye bir kategori (ör. Biralar) seçiliyken bir sonraki satırda listelenir.
  const mobileSubSubcategories = useMemo(() => {
    const secondLevelCategory = selectedCategoryLineage[1];
    if (!secondLevelCategory) {
      return [];
    }

    return sortCategoriesByOrder(
      categories.filter((category) => category.parent_id === secondLevelCategory.id),
    ).map((child) => ({ id: child.id, name: child.name }));
  }, [categories, selectedCategoryLineage]);

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);
  const cartCurrency = useMemo(() => getCartCurrency(cart), [cart]);
  const cartTotalsByCurrency = useMemo(() => getCartTotalsByCurrency(cart), [cart]);
  // Minimum sepet tutarı yalnızca tek para birimli sepetlerde uygulanır —
  // birden fazla para birimi karışmışsa (nadir bir durum) hangi tutara göre
  // ölçüleceği belirsiz olacağından zorunluluk devre dışı bırakılır.
  const isMinCartAmountMet =
    !storefrontSettings.is_min_cart_amount_active ||
    Object.keys(cartTotalsByCurrency).length > 1 ||
    cartTotal >= storefrontSettings.min_cart_amount;
  const minCartAmountRemaining = Math.max(
    0,
    (storefrontSettings.min_cart_amount ?? 0) - cartTotal,
  );

  // Getirme (teslimat) ücreti — yalnız market tenantlar. Ödeme yöntemi
  // seçilmeden de sepet özetinde gösterilir; çoklu para birimli sepette
  // uygulanmaz (getCartPaymentSummary ile aynı varsayım).
  const deliveryFeeConfig = useMemo(
    () =>
      isMarketTenant && storefrontSettings.is_delivery_fee_active
        ? {
            isActive: true,
            amount: storefrontSettings.delivery_fee_amount ?? 0,
            freeThreshold: storefrontSettings.delivery_fee_free_threshold ?? 0,
          }
        : null,
    [
      isMarketTenant,
      storefrontSettings.is_delivery_fee_active,
      storefrontSettings.delivery_fee_amount,
      storefrontSettings.delivery_fee_free_threshold,
    ],
  );
  const isSingleCurrencyCart = Object.keys(cartTotalsByCurrency).length <= 1;
  const deliveryFeeAmount = isSingleCurrencyCart
    ? getDeliveryFeeAmount(deliveryFeeConfig, cartTotal)
    : 0;
  const deliveryFeeFreeThreshold = deliveryFeeConfig?.freeThreshold ?? 0;
  const deliveryFeeRemaining =
    deliveryFeeAmount > 0 && deliveryFeeFreeThreshold > 0
      ? Math.max(0, deliveryFeeFreeThreshold - cartTotal)
      : 0;
  const cartDiscountSummary = useMemo(
    () =>
      getCartDiscountSummary(cart, {
        tiers: storefrontSettings.cash_discount_tiers ?? [],
        isActive: storefrontSettings.is_cash_discount_active,
      }),
    [
      cart,
      storefrontSettings.cash_discount_tiers,
      storefrontSettings.is_cash_discount_active,
    ],
  );
  const cartCardCampaignStatus = useMemo(
    () =>
      getCartCardCampaignStatus(cart, {
        tiers: storefrontSettings.card_campaign_tiers ?? [],
        isActive: storefrontSettings.is_card_campaign_active,
      }),
    [
      cart,
      storefrontSettings.card_campaign_tiers,
      storefrontSettings.is_card_campaign_active,
    ],
  );
  // Ödeme yöntemi seçilmeden önce de gösterilir: "fark etmez" kampanyalar
  // uygulanır, yönteme bağlı olanlar "kazanabilirsiniz" olarak listelenir.
  // Bayi bir kategoriyi kampanya dışında bıraktığında ALT kategorileri de
  // dışarıda kalmalı: "Sigara" hariç tutulduysa "Sigara > Filtreli" de
  // sayılmamalı. Kayıtta yalnızca seçilen id'ler duruyor, ağaç burada
  // genişletiliyor — kategori ağacı değişince kayıt güncellenmek zorunda
  // kalmasın diye.
  const excludedCategoriesByCampaign = useMemo(() => {
    const harita = new Map<string, Set<string>>();

    for (const campaign of campaigns) {
      const secilen = campaign.excluded_category_ids ?? [];
      if (!secilen.length) continue;

      const kume = new Set<string>();
      for (const categoryId of secilen) {
        kume.add(categoryId);
        for (const altId of getDescendantCategoryIds(categories, categoryId)) {
          kume.add(altId);
        }
      }
      harita.set(campaign.id, kume);
    }

    return harita;
  }, [campaigns, categories]);

  const campaignStatus = useMemo(
    () =>
      getCampaignDiscountStatus(
        cart,
        campaigns,
        selectedPaymentMethod,
        excludedCategoriesByCampaign,
      ),
    [cart, campaigns, selectedPaymentMethod, excludedCategoriesByCampaign],
  );

  const cartPaymentSummary = useMemo(() => {
    if (!selectedPaymentMethod || !cart.length) return null;
    // Fiyatsız katalogda tutar yok; ödeme yöntemi sadece bilgi olarak taşınır.
    if (isCatalogOnly) return null;

    const cashConfig = {
      tiers: storefrontSettings.cash_discount_tiers ?? [],
      isActive: storefrontSettings.is_cash_discount_active,
    };
    const cardConfig = {
      tiers: storefrontSettings.card_campaign_tiers ?? [],
      isActive: storefrontSettings.is_card_campaign_active,
    };

    const activeOptions =
      (storefrontSettings.card_installment_options ?? []).filter(
        (o: InstallmentOption) => o.isActive,
      );
    const selectedInstallment =
      selectedPaymentMethod === "card" && selectedInstallmentCount !== null
        ? (activeOptions.find((o: InstallmentOption) => o.count === selectedInstallmentCount) ?? null)
        : null;

    return getCartPaymentSummary(
      cart,
      selectedPaymentMethod,
      cashConfig,
      cardConfig,
      selectedInstallment,
      campaigns,
      excludedCategoriesByCampaign,
      customerCoupon,
      deliveryFeeConfig,
    );
  }, [
    deliveryFeeConfig,
    excludedCategoriesByCampaign,
    campaigns,
    customerCoupon,
    cart,
    selectedPaymentMethod,
    selectedInstallmentCount,
    storefrontSettings.cash_discount_tiers,
    storefrontSettings.is_cash_discount_active,
    storefrontSettings.card_campaign_tiers,
    storefrontSettings.is_card_campaign_active,
    storefrontSettings.card_installment_options,
    isCatalogOnly,
  ]);
  const cartQuantityByProductId = useMemo(
    () => new Map(cart.map((item) => [item.id, item.quantity])),
    [cart],
  );
  // Paket/koli satırları farklı satır kimliği taşır; ürün bazında TOPLAM adet
  // (varyantsız) — çapraz satış kartlarındaki sayaç/çizgi bunu kullanır.
  const cartUnitTotalsByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      if (item.variant_id) continue;
      map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity);
    }
    return map;
  }, [cart]);
  // Sayfa üzerinde herhangi bir yerde (ana katalog sayfası, öne çıkan
  // bölümler, promosyon şeridi, öneri widget'ı) gösterilen ürünler artık
  // ayrı, küçük sunucu sorgularından geliyor — `products` yalnızca ana
  // kataloğun o ana kadar yüklenmiş sayfasını tutuyor. Detay modalı/sepete
  // ekleme gibi id ile arama yapan her şey bu kaynakların BİRLEŞİMİNE
  // bakmalı, yoksa örn. bir öneri kartına tıklamak sessizce hiçbir şey
  // yapmaz (ürün ana grid'de yüklü değilse).
  const productsById = useMemo(() => {
    const map = new Map<string, StorefrontProduct>();
    for (const product of products) {
      map.set(product.id, product);
    }
    for (const section of sections) {
      for (const product of section.products) {
        map.set(product.id, product);
      }
    }
    for (const product of promoProducts) {
      map.set(product.id, product);
    }
    // Çok satanlar şeridi de kendi sunucu sorgusundan geliyor; haritaya
    // eklenmezse oradaki kartların "+" butonu ve detay modalı sessizce
    // hiçbir şey yapmıyordu (ürün ana katalog sayfasında yüklü değilse).
    for (const product of bestSellerProducts) {
      map.set(product.id, product);
    }
    // "Yanında iyi gider" ürünleri de ayrı sorgudan gelir; haritada yoksa
    // + butonu ve detay modalı sessizce çalışmıyordu (buz küpleri vakası).
    for (const product of complementProducts) {
      map.set(product.id, product);
    }
    for (const product of pairPreviewProducts) {
      map.set(product.id, product);
    }
    for (const product of recommendationPool) {
      map.set(product.id, product);
    }
    // Sepet 2. adımının donmuş öneri listesi: kartların "+" butonu çalışsın diye.
    for (const product of cartSuggestionsSnapshot) {
      map.set(product.id, product);
    }
    for (const product of giftCampaignProducts) {
      map.set(product.id, product);
    }
    return map;
  }, [
    products,
    sections,
    promoProducts,
    bestSellerProducts,
    recommendationPool,
    complementProducts,
    pairPreviewProducts,
    cartSuggestionsSnapshot,
    giftCampaignProducts,
  ]);
  const cartVariantCountByProductId = useMemo(
    () =>
      new Map(
        [...productsById.keys()].map((productId) => [productId, getCartVariantCount(cart, productId)]),
      ),
    [cart, productsById],
  );
  // "N al Y hediye" kampanyalarının tetikleyici/hediye ürün id'leri (market/
  // tekel sadece — bkz. tenant-campaigns-form.tsx).
  const giftCampaignProductIds = useMemo(() => {
    if (!isMarketTenant) return [] as string[];
    const ids = new Set<string>();
    for (const campaign of campaigns) {
      if (campaign.rule_type !== "buy_x_get_y") continue;
      if (campaign.gift_trigger_product_id) ids.add(campaign.gift_trigger_product_id);
      for (const id of campaign.gift_product_ids ?? []) ids.add(id);
    }
    return [...ids];
  }, [isMarketTenant, campaigns]);

  // Bu ürünler productsById'de yoksa çöz — yoksa otomatik hediye ekleme
  // sessizce çalışmaz (aynı "buz küpleri" hatası).
  useEffect(() => {
    if (!subdomain || !giftCampaignProductIds.length) return;
    const missing = giftCampaignProductIds.filter((id) => !productsById.has(id));
    if (!missing.length) return;

    const abortController = new AbortController();
    void (async () => {
      try {
        const params = new URLSearchParams({ subdomain, ids: missing.join(",") });
        const response = await fetch(`/api/storefront/products-by-ids?${params.toString()}`, {
          signal: abortController.signal,
        });
        if (!response.ok) return;
        const result = await response.json();
        const fetched = Array.isArray(result.products)
          ? (result.products as StorefrontProduct[])
          : [];
        if (!fetched.length) return;
        setGiftCampaignProducts((current) => {
          const map = new Map(current.map((product) => [product.id, product]));
          for (const product of fetched) map.set(product.id, product);
          return [...map.values()];
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    })();

    return () => abortController.abort();
  }, [subdomain, giftCampaignProductIds, productsById]);

  // Sepetteki hediye satırlarını aktif "N al Y hediye" kampanyalarıyla
  // eşitle: tetikleyici eşiği tutan yeni satır ekler, tutmayanı kaldırır,
  // katlanan eşiklerde adedi günceller. reconcileGiftCartLines değişiklik
  // yoksa AYNI referansı döndürür — sonsuz döngü olmaz.
  useEffect(() => {
    if (!isMarketTenant) return;
    const plans = computeGiftCampaignPlans(cart, campaigns);
    setCart((current) => reconcileGiftCartLines(current, plans, productsById));
  }, [isMarketTenant, cart, campaigns, productsById]);

  const cartTotalEntries = useMemo(
    () =>
      supportedCurrencyCodes
        .map((currency) => ({
          currency,
          total: cartTotalsByCurrency[currency],
        }))
        .filter(
          (
            item,
          ): item is {
            currency: (typeof supportedCurrencyCodes)[number];
            total: number;
          } => typeof item.total === "number",
        ),
    [cartTotalsByCurrency],
  );
  const cartDistinctCount = cart.length;
  const selectedQuantityValue = parseUnitCount(selectedQuantity);
  const selectedPackageCountValue = parseUnitCount(selectedPackageCount);
  const selectedCartonCountValue = parseUnitCount(selectedCartonCount);

  const handleOpenProductDetail = useCallback(
    (productId: string) => {
      const product = productsById.get(productId);

      if (!product) {
        return;
      }

      setPreviewProduct(product);
      setActivePreviewTab(null);
      setActivePreviewImageIndex(0);

      if (analyticsSubdomain) {
        trackStorefrontProductView(tenant.id, analyticsSubdomain, product.id);
      }
    },
    [analyticsSubdomain, productsById, tenant.id],
  );

  /* Sepete ekleme geri bildirimi ----------------------------------------
     Uçuş animasyonu kaldırıldı (kullanıcı kararı, 1 Eyl 2026): geri
     bildirim artık Getir tarzı — sepetteki ürünün görseli tema renginde
     ince bir çerçeveyle sarılıyor (bkz. storefront-product-card.tsx).
     Rozet sayısı beklemeden güncellenir. */
  const cartItemCountRef = useRef(0);
  const pendingFlightsRef = useRef(0);
  const [badgeCartCount, setBadgeCartCount] = useState(0);

  const runCartFlight = useCallback((productId: string, nextFrame = false) => {
    pendingFlightsRef.current += 1;
    const settle = () => {
      pendingFlightsRef.current = Math.max(0, pendingFlightsRef.current - 1);
      setBadgeCartCount(cartItemCountRef.current);
    };
    // Animasyon yok; parametreler çağıran yerler bozulmasın diye duruyor.
    void productId;
    void nextFrame;
    settle();
  }, []);

  const handleIncreaseCartItem = useCallback(
    (productId: string) => {
      setCart((current) => {
        const currentQuantity = current.find((item) => item.id === productId)?.quantity ?? 0;
        return updateCartLineQuantity(current, productId, currentQuantity + 1);
      });
      runCartFlight(productId);
    },
    [runCartFlight],
  );

  const handleDecreaseCartItem = useCallback((productId: string) => {
    setCart((current) => {
      const currentQuantity = current.find((item) => item.id === productId)?.quantity ?? 0;
      return updateCartLineQuantity(current, productId, currentQuantity - 1);
    });
  }, []);

  const handleOpenAddToCartModal = useCallback(
    (productId: string) => {
      const product = productsById.get(productId);

      if (!product || !product.is_in_stock) {
        return;
      }

      setSelectedProduct(product);
      setVariantSearchTerm("");
      setQuantityError(null);

      const currentCart = cartRef.current;

      if (product.has_variants) {
        setVariantSelections(
          currentCart
            .filter((item) => item.product_id === product.id && item.variant_id)
            .map((item) => ({
              variantId: item.variant_id!,
              unit: "adet" as SalesUnit,
              quantity: item.quantity,
            })),
        );
        setSelectedQuantity("");
        setSelectedPackageCount("");
        setSelectedCartonCount("");
        return;
      }

      const existingItem = currentCart.find((item) => item.id === product.id);
      setSelectedQuantity(
        existingItem?.quantity ? String(existingItem.quantity) : "",
      );
      setSelectedPackageCount("");
      setSelectedCartonCount("");
      setVariantSelections([]);
    },
    [productsById],
  );

  // Paket/koli adedi (veya model seçeneği) girilmemiş ürünlerde ilk "+"
  // tıklaması Getir'deki gibi doğrudan 1 adet ekler ve kartın üstünde
  // +/- steppera geçer — seçim gerektiren bir şey yoksa modalı atlıyoruz.
  // Paket/koli/model seçeneği olan ürünlerde davranış değişmiyor: modal açılır.
  const handleQuickAddOrOpenModal = useCallback(
    (productId: string) => {
      const product = productsById.get(productId);

      if (!product || !product.is_in_stock) {
        return;
      }

      // Market tipi mağazalarda paket/koli kavramı yok; olası eski/içe aktarılmış
      // değerler "+" akışını modala sokmasın (kullanıcı isteği, 4 Eyl 2026).
      const needsSelection =
        product.has_variants ||
        (!isMarketTenant &&
          (Boolean(product.package_quantity) || Boolean(product.carton_quantity)));

      if (needsSelection) {
        handleOpenAddToCartModal(productId);
        return;
      }

      setCart((current) => addToCart(current, product, 1));
      runCartFlight(product.id);

      if (analyticsSubdomain) {
        trackStorefrontCartAdd(analyticsSubdomain, product.id);
      }
    },
    [productsById, handleOpenAddToCartModal, analyticsSubdomain, runCartFlight, isMarketTenant],
  );

  const visibleProducts = products;
  const selectedCategory =
    selectedCategoryId === "all"
      ? null
      : categories.find((category) => category.id === selectedCategoryId) ?? null;
  const categoryBanner = selectedCategory?.banner_item ?? null;
  const showHomeBanner =
    !homeHref && selectedCategoryId === "all" && !searchInput.trim();
  const showCategoryBanner =
    !homeHref &&
    selectedCategoryId !== "all" &&
    !searchInput.trim() &&
    Boolean(categoryBanner?.image_url);
  const showBannerSection =
    (showHomeBanner || showCategoryBanner) &&
    (showCategoryBanner || isHomepageBlockVisible(homepageBlocks, "banner"));
  const allBannerItems =
    showCategoryBanner && categoryBanner
      ? [categoryBanner]
      : (storefrontSettings.banner_items ?? []);
  // Her banner kendi "mobilde göster" ayarını taşır — mobil ziyaretçide
  // carousel sadece o banner'ları döner, masaüstünde hepsi görünür.
  const bannerItems = isMobileViewport
    ? allBannerItems.filter((banner) => banner.is_visible_on_mobile !== false)
    : allBannerItems;
  const currentBanner = bannerItems[activeBannerIndex] ?? null;
  const heroClusterItems = storefrontSettings.hero_cluster_items ?? [];
  const showSections =
    showHomeBanner && sections.length > 0 && isHomepageBlockVisible(homepageBlocks, "showcase");
  // "En Çok Satanlar" reorder edilebilir homepage_blocks setinin parçası
  // değil — admin sadece aç/kapat + ürün sayısı ayarlıyor (bkz. tenant-
  // storefront settings), konumu her zaman "Öne Çıkan Bölümler"in hemen
  // altında sabit (aşağıda "showcase" block case'inin sonuna ekleniyor).
  const visibleBestSellerProducts = storefrontSettings.is_best_sellers_visible
    ? bestSellerProducts.slice(0, storefrontSettings.best_sellers_product_count)
    : [];
  const showBestSellers = showHomeBanner && visibleBestSellerProducts.length > 0;
  const showHeroCluster =
    showHomeBanner &&
    heroClusterItems.length >= 2 &&
    isHomepageBlockVisible(homepageBlocks, "heroCluster");
  const showPromoTiles =
    showHomeBanner && isHomepageBlockVisible(homepageBlocks, "promoTiles");
  const showCategoryTilesBlock =
    showHomeBanner && topCategories.length > 0 && isHomepageBlockVisible(homepageBlocks, "categoryTiles");
  const showBanner2Section =
    showHomeBanner && bannerItems.length > 0 && isHomepageBlockVisible(homepageBlocks, "banner2");
  const showHeroBlock =
    showHomeBanner && isHomepageBlockVisible(homepageBlocks, "hero");
  const showCatalogBlock =
    selectedCategoryId !== "all" ||
    searchInput.trim().length > 0 ||
    isHomepageBlockVisible(homepageBlocks, "catalog");
  // Noir'de mobil anasayfa saf bir kategori seçim ekranı olsun — ürünler
  // sadece bir kategoriye (veya aramaya) girildiğinde görünsün. Masaüstünde
  // ve diğer temalarda davranış aynen korunur.
  const isNoirTheme = storefrontSettings.theme_key === "noir";
  const hideHomeProductsOnMobile = isNoirTheme && isMobileViewport && showHomeBanner;
  // Noir mobilde kategori kutucukları normalde blok sırasından çıkarılıp
  // doğrudan banner'ın içine enjekte edilir. Market/tekel bayilerde
  // istenen sıra banner -> indirim şeridi -> kategoriler olduğu için bu
  // enjeksiyon kapatılıyor; sırayı blok haritası yönetiyor (bkz.
  // usesMarketMobileOrder). Aksi halde kategoriler indirim şeridinin
  // üstünde kalıyordu.
  const showCategoryTilesOnMobileAfterBanner =
    isNoirTheme && isMobileViewport && showCategoryTilesBlock && !usesMarketMobileOrder;
  const recommendedProducts = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.product_id));
    const availableProducts = dedupeProducts([
      ...sections.flatMap((section) => section.products),
      ...recommendationPool,
    ]).filter((product) => product.is_in_stock && !cartIds.has(product.id));

    if (storefrontSettings.recommendation_mode === "manual") {
      const manuallyRecommended = availableProducts.filter((product) => product.is_recommended);

      if (manuallyRecommended.length > 0) {
        return manuallyRecommended.slice(0, 10);
      }
    }

    // Sepetteki ürünlerle aynı kategoriden olanları öne al (çapraz satış),
    // geri kalanını rastgele sırayla doldur — aksi halde her açılışta
    // katalogdaki ilk 10 ürün sabit şekilde gösteriliyordu.
    const cartCategoryIds = new Set(
      cart.map((item) => item.category_id).filter((id): id is string => Boolean(id)),
    );
    const shuffled = shuffleProductsBySeed(availableProducts, recommendationSeed);
    const crossSell = shuffled.filter((product) => cartCategoryIds.has(product.category_id));
    const rest = shuffled.filter((product) => !cartCategoryIds.has(product.category_id));

    return [...crossSell, ...rest].slice(0, 10);
  }, [cart, recommendationPool, sections, storefrontSettings.recommendation_mode, recommendationSeed]);

  // Ürün önizleme modalındaki (bkz. renderProductPreviewModal) "Bunlar da
  // ilgini çekebilir" bölümü — client'a önceden yüklenmiş sections/
  // recommendationPool örneklem havuzuna güvenmek yerine (bu havuz
  // tenant genelinde en fazla 300 ürünlük bir örneklem olduğundan
  // "Fırından" gibi az ürünlü/düşük öncelikli kategoriler hiç
  // girmeyebiliyordu — kullanıcı geri bildirimi, 19 Ağu 2026) modal her
  // açıldığında o ürünün kategorisine özel /api/storefront/products
  // sorgusu yapılır; kategori az ürünlüyse üst kategorinin tüm alt
  // kategorilerine genişletilir. Aynı kategori için sonuç oturum
  // boyunca önbelleğe alınır.
  useEffect(() => {
    if (!previewProduct || !subdomain) {
      setRelatedPreviewProducts([]);
      return;
    }

    const lineage = getCategoryLineage(categories, previewProduct.category_id);
    const parent = lineage.length >= 2 ? lineage[lineage.length - 2] : null;
    const matchCategoryIds = parent
      ? getDescendantCategoryIds(categories, parent.id)
      : [previewProduct.category_id];
    const cacheKey = matchCategoryIds.slice().sort().join(",");
    const productId = previewProduct.id;

    const applyResult = (list: StorefrontProduct[]) => {
      const filtered = list.filter((product) => product.id !== productId && product.is_in_stock);
      setRelatedPreviewProducts(shuffleProductsBySeed(filtered, recommendationSeed).slice(0, 10));
    };

    const cached = relatedPreviewCacheRef.current.get(cacheKey);
    if (cached) {
      applyResult(cached);
      return;
    }

    relatedPreviewAbortRef.current?.abort();
    const abortController = new AbortController();
    relatedPreviewAbortRef.current = abortController;

    void (async () => {
      try {
        const params = new URLSearchParams({
          subdomain,
          categoryIds: matchCategoryIds.join(","),
          page: "1",
        });
        const response = await fetch(`/api/storefront/products?${params.toString()}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        const fetched = Array.isArray(result.products) ? (result.products as StorefrontProduct[]) : [];

        relatedPreviewCacheRef.current.set(cacheKey, fetched);

        if (!abortController.signal.aborted) {
          applyResult(fetched);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [previewProduct, subdomain, categories, recommendationSeed]);
  const buildWhatsAppOrderMessage = useCallback(
    (pdfUrl?: string | null, trackingUrl?: string | null, locationUrl?: string | null) => {
      return buildWhatsAppMessage({
        tenantName: tenant.company_name,
        customerReferenceName,
        customerAddress: isMarketTenant ? customerAddress : undefined,
        customerLocationUrl: isMarketTenant ? locationUrl ?? null : null,
        customerPhone: isMarketTenant ? customerPhone : undefined,
        pdfUrl,
        trackingUrl,
        isTekel,
      });
    },
    [customerReferenceName, customerAddress, customerPhone, isMarketTenant, isTekel, tenant.company_name],
  );

  const clearWhatsappHandoff = useCallback(() => {
    setWhatsappHandoff(null);
    setOrderPdfError(null);
  }, []);

  // Form verisi değişince hazır mesajı geçersiz kıl. KONUM BURADA OLMAMALI:
  // konum, gönderim anında mesajın içine yazılıyor; sonradan koordinatın
  // güncellenmesi (izin verildikten 1-5 sn sonra gelmesi) hazır mesajı
  // silmemeli. Bağımlılıklara yanlışlıkla eklenmişti ve WhatsApp ekranı
  // konum gelir gelmez kayboluyordu (6 Eyl 2026).
  useEffect(() => {
    setWhatsappHandoff(null);
    setOrderPdfError(null);
  }, [
    cart,
    customerReferenceName,
    customerAddress,
    customerPhone,
    note,
    selectedInstallmentCount,
    selectedPaymentMethod,
  ]);

  const handleWhatsAppOrder = useCallback(async () => {
    if (!cart.length || !isMinCartAmountMet) {
      return;
    }

    // "Yanında iyi gider" hatırlatması artık sepet çekmecesinin 2. adımında
    // (market/tekel adımlı akış, bkz. storefront-cart-drawer.tsx); burada
    // ayrı bir popup gösterilmiyor — "Siparişi Ver"e basıldığında doğrudan
    // validasyon + sipariş akışı çalışır.

    if (isMarketTenant) {
      let hasValidationError = false;

      if (!selectedPaymentMethod) {
        setPaymentMethodError(t("cart.paymentMethodRequiredError"));
        hasValidationError = true;
      }

      if (!customerReferenceName.trim()) {
        setCustomerReferenceNameError(t("cart.customerNameRequiredError"));
        hasValidationError = true;
      }

      // Tekelde de adres isteniyor (kullanici karari, 25 Agu 2026): gel-al
      // olsa bile musteri defteri ve magnet sahiplenmesi icin adres lazim.
      // Gel-al WhatsApp mesajina adres EKLENMIYOR — bkz. lib/storefront/cart.ts.
      if (!customerAddress.trim()) {
        setCustomerAddressError(t("cart.customerAddressRequiredError"));
        hasValidationError = true;
      }

      if (!customerPhone.trim()) {
        setCustomerPhoneError(t("cart.customerPhoneRequiredError"));
        hasValidationError = true;
      } else if (!validateCustomerPhoneInput(customerPhone)) {
        // TR numarası 05xx biçimine oturmalı; yabancı numara + ülke koduyla.
        setCustomerPhoneError(t("cart.customerPhoneFormatError"));
        hasValidationError = true;
      }

      if (hasValidationError) {
        // Her denemede artır: aynı alan aynı hatayla tekrar boşsa da sepet
        // çekmecesi o alana yeniden kaysın (bkz. storefront-cart-drawer.tsx).
        setCheckoutValidationNonce((n) => n + 1);
        return;
      }
    }

    const requestId = crypto.randomUUID();
    setOrderPdfError(null);
    setWhatsappHandoff(null);
    setIsGeneratingOrderPdf(true);
    let pdfUrl: string | null = null;
    let pdfIncluded = false;
    let trackingUrl: string | null = null;
    let locationUrl: string | null = null;

    try {
      const result = await requestOrderReceiptPdf({
        requestId,
        body: {
          subdomain: analyticsSubdomain,
          catalog_mode: isCatalogOnly,
          items: cart,
          note,
          customer_reference_name: customerReferenceName.trim(),
          customer_phone: isMarketTenant ? customerPhone.trim() : "",
          customer_address: isMarketTenant ? customerAddress.trim() : "",
          customer_location: isMarketTenant ? customerLocation : null,
          paymentMethod: selectedPaymentMethod,
          selectedInstallmentCount: isCatalogOnly ? null : selectedInstallmentCount,
          cashDiscountTiers: storefrontSettings.cash_discount_tiers ?? [],
          isCashDiscountActive: storefrontSettings.is_cash_discount_active,
          cardCampaignTiers: storefrontSettings.card_campaign_tiers ?? [],
          isCardCampaignActive: storefrontSettings.is_card_campaign_active,
          cardInstallmentOptions: storefrontSettings.card_installment_options ?? [],
        },
      });
      pdfUrl = result.pdfUrl;
      pdfIncluded = true;
      trackingUrl = result.trackingUrl ?? null;
      // Sipariş kaydedildi: bu numara takip sayfasına "giriş yapmış" olur.
      // Başka numarayla sipariş verilirse üzerine yazılır.
      if (isMarketTenant && customerPhone.trim()) saveTrackingPhone(customerPhone);
    } catch (error) {
      const apiError =
        error instanceof OrderPdfRequestError && error.apiError?.trim()
          ? error.apiError.trim()
          : null;

      // 403/429 = sipariş REDDEDİLDİ (engelli telefon / engelli IP). Diğer
      // hatalardan farklı: aşağıdaki "PDF olmasa da WhatsApp'a devam et"
      // toleransı burada uygulanmaz, yoksa engel kağıt üstünde kalır —
      // müşteri PDF'siz mesajı yine de gönderebilirdi.
      if (
        error instanceof OrderPdfRequestError &&
        (error.statusCode === 403 || error.statusCode === 429)
      ) {
        setOrderPdfError(apiError ?? "Sipariş alınamadı. Lütfen mağaza ile iletişime geçin.");
        return; // finally yine çalışır, spinner kapanır

      }

      // API'nin döndüğü asıl nedeni müşteriye göster (ör. "Tek para birimi
      // kullanın"); genel mesaj yalnızca neden bilinmiyorsa kalır.
      setOrderPdfError(
        apiError ? `${ORDER_PDF_ERROR_MESSAGE} Neden: ${apiError}` : ORDER_PDF_ERROR_MESSAGE,
      );
    } finally {
      setIsGeneratingOrderPdf(false);
    }

    // Konum linki bilerek KISALTILMIYOR ve doğrudan Google adresiyle
    // yazılıyor (kullanıcı isteği, 6 Eyl 2026): bayi linke bakınca bunun bir
    // harita olduğunu anlıyor ve telefonundaki Google Haritalar uygulaması
    // doğrudan açılıyor. Ayrıca sunucuya hiç uğramadığı için PDF/veritabanı
    // tarafında bir sorun olsa bile konum satırı kaybolmuyor.
    // Müşteri kutuyu işaretleyip hemen gönderdiyse koordinat henüz gelmemiş
    // olabilir; devam eden isteği burada bekliyoruz. Gelmezse sipariş yine
    // gider, sadece konum satırı olmaz.
    let coords = customerLocationRef.current;
    if (shareLocationRef.current && !coords) {
      // Devam eden isteği bekle ama siparişi sonsuza kadar tutma. Yeni bir
      // konum isteği BAŞLATMIYORUZ — izin penceresi açıkken ikinci istek
      // reddedilmeye yol açıyor.
      const pending = locationPromiseRef.current;
      coords = pending
        ? await Promise.race([
            pending,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
          ])
        : null;
    }

    if (coords) {
      locationUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    }

    const message = buildWhatsAppOrderMessage(pdfUrl, trackingUrl, locationUrl);
    setWhatsappHandoff(
      buildWhatsAppOrderHandoff({
        phone: tenant.whatsapp_number,
        message,
        directToRegisteredNumber: tenant.is_whatsapp_order_direct ?? true,
        pdfIncluded,
        trackingUrl,
      }),
    );
  }, [
    analyticsSubdomain,
    buildWhatsAppOrderMessage,
    cart,
    customerReferenceName,
    customerAddress,
    customerPhone,
    note,
    selectedInstallmentCount,
    selectedPaymentMethod,
    storefrontSettings.card_campaign_tiers,
    storefrontSettings.card_installment_options,
    storefrontSettings.cash_discount_tiers,
    storefrontSettings.is_card_campaign_active,
    storefrontSettings.is_cash_discount_active,
    tenant.is_whatsapp_order_direct,
    tenant.whatsapp_number,
    isCatalogOnly,
    isMinCartAmountMet,
    isMarketTenant,
    t,
  ]);
  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );
  const previousCartItemCountRef = useRef(cartItemCount);


  useEffect(() => {
    cartItemCountRef.current = cartItemCount;
    if (pendingFlightsRef.current === 0) setBadgeCartCount(cartItemCount);
  }, [cartItemCount]);

  useEffect(() => {
    if (!cart.length) {
      setIsStickyCartBarDismissed(false);
      previousCartItemCountRef.current = 0;
      return;
    }

    if (cartItemCount > previousCartItemCountRef.current) {
      setIsStickyCartBarDismissed(false);
    }

    previousCartItemCountRef.current = cartItemCount;
  }, [cartItemCount, cart.length]);

  const selectedTotalQuantity = useMemo(() => {
    if (!selectedProduct) {
      return 0;
    }

    if (
      selectedQuantityValue === null ||
      selectedPackageCountValue === null ||
      selectedCartonCountValue === null
    ) {
      return 0;
    }

    return (
      selectedQuantityValue +
      selectedPackageCountValue * (selectedProduct.package_quantity ?? 0) +
      selectedCartonCountValue * (selectedProduct.carton_quantity ?? 0)
    );
  }, [
    selectedCartonCountValue,
    selectedPackageCountValue,
    selectedProduct,
    selectedQuantityValue,
  ]);
  const selectedLineTotal =
    selectedProduct && selectedTotalQuantity > 0
      ? (selectedProduct.price ?? 0) * selectedTotalQuantity
      : 0;
  const filteredSelectedVariants = useMemo(() => {
    if (!selectedProduct?.has_variants) {
      return [];
    }

    return selectedProduct.variants.filter((variant) =>
      matchesVariantSearch(variant.model_name, variantSearchTerm),
    );
  }, [selectedProduct, variantSearchTerm]);
  const selectedVariantSummary = useMemo(() => {
    if (!selectedProduct?.has_variants) {
      return { count: 0, total: 0 };
    }

    const activeSelections = variantSelections.filter((selection) => selection.quantity > 0);

    return {
      count: activeSelections.length,
      total: activeSelections.reduce((total, selection) => {
        const variant = selectedProduct.variants.find(
          (item) => item.id === selection.variantId,
        );

        if (!variant) {
          return total;
        }

        return (
          total +
          getRequestedUnitQuantity({
            unit: selection.unit,
            quantity: selection.quantity,
            variant,
          }) *
            (variant.price ?? 0)
        );
      }, 0),
    };
  }, [selectedProduct, variantSelections]);
  const storefrontTitle = storefrontSettings.storefront_title || tenant.company_name;
  // Yoğunluk modu: bayi tek tuşla açar, vitrini açan müşteriye uyarı
  // gösterilir. Duyurudan bağımsız ve ondan ÖNCELİKLİ — yoğunluk anlık bir
  // bilgi, kalıcı duyurunun arkasında kalmamalı.
  //
  // sessionStorage kullanılıyor (duyurudaki localStorage + sürüm sayacı
  // değil): yoğunluk geçici bir durum, müşteri sekmesini kapatıp tekrar
  // girdiğinde güncel durumu yeniden görmeli. Aynı oturumda ise tekrar
  // tekrar çıkmamalı.
  const busyNote =
    storefrontSettings.busy_mode_note?.trim() ||
    "Şu anda biraz yoğunuz, siparişiniz beklenenden biraz daha gecikebilir. Anlayışınız için teşekkür ederiz.";
  const busyModeOn = !homeHref && Boolean(storefrontSettings.is_busy_mode);
  const [showBusyModal, setShowBusyModal] = useState(false);

  useEffect(() => {
    if (!busyModeOn) {
      setShowBusyModal(false);
      return;
    }

    const key = `ekatalox_busy_seen_${tenant.id}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") return;
    } catch {
      // sessionStorage kapalıysa (gizli sekme kısıtları) yine de göster.
    }
    setShowBusyModal(true);
  }, [busyModeOn, tenant.id]);

  function dismissBusyModal() {
    setShowBusyModal(false);
    try {
      window.sessionStorage.setItem(`ekatalox_busy_seen_${tenant.id}`, "1");
    } catch {
      // yoksay
    }
  }

  const activeAnnouncement = useMemo<ActiveAnnouncement | null>(() => {
    if (homeHref || !storefrontSettings.is_active) {
      return null;
    }

    const title = storefrontSettings.announcement_title?.trim() ?? "";
    const body = storefrontSettings.announcement_body?.trim() ?? "";

    if (!title || !body) {
      return null;
    }

    return {
      title,
      body,
      version:
        Number.isInteger(storefrontSettings.version) && storefrontSettings.version > 0
          ? storefrontSettings.version
          : 0,
      maxDisplayCount:
        Number.isInteger(storefrontSettings.max_display_count) &&
        storefrontSettings.max_display_count > 0
          ? storefrontSettings.max_display_count
          : 1,
    };
  }, [
    homeHref,
    storefrontSettings.announcement_body,
    storefrontSettings.announcement_title,
    storefrontSettings.is_active,
    storefrontSettings.max_display_count,
    storefrontSettings.version,
  ]);
  const isAnnouncementEligible = useSyncExternalStore(
    subscribeToAnnouncementStorage,
    () =>
      getAnnouncementVisibility({
        activeAnnouncement,
        storageKeys: announcementStorageKeys,
      }),
    () => false,
  );
  const announcementRenderKey = activeAnnouncement
    ? `${activeAnnouncement.version}-${readStoredCounterValue(announcementStorageKeys.views)}`
    : null;
  useEffect(() => {
    if (!isMounted || !analyticsSubdomain) {
      return;
    }

    trackStorefrontVisit(tenant.id, analyticsSubdomain);
  }, [analyticsSubdomain, isMounted, tenant.id]);

  useEffect(() => {
    if (!isMounted || !analyticsSubdomain) {
      return;
    }

    return startStorefrontHeartbeat(tenant.id, analyticsSubdomain);
  }, [analyticsSubdomain, isMounted, tenant.id]);

  useEffect(() => {
    if (!isMounted || !analyticsSubdomain) {
      return;
    }

    const normalizedSearch = debouncedSearchTerm.trim().toLocaleLowerCase("tr-TR");
    if (normalizedSearch.length < 2) {
      return;
    }

    trackStorefrontSearch(tenant.id, analyticsSubdomain, {
      query: normalizedSearch,
      resultCount: productTotal,
    });
  }, [
    analyticsSubdomain,
    debouncedSearchTerm,
    productTotal,
    isMounted,
    tenant.id,
  ]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (!cart.length) {
      window.localStorage.removeItem(cartStorageKey);
      return;
    }

    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, cartStorageKey, isMounted]);

  useEffect(() => {
    setActiveBannerIndex(0);
  }, [selectedCategoryId, showCategoryBanner]);

  useEffect(() => {
    // Mobil/masaüstü geçişinde filtrelenmiş liste kısalabilir; index'i
    // sınırların dışında bırakmamak için sıfırlıyoruz.
    setActiveBannerIndex(0);

    if (bannerItems.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      // Kullanıcı az önce elle kaydırdıysa sırayı ona bırak.
      if (Date.now() - bannerInteractionRef.current < 8000) {
        return;
      }
      setActiveBannerIndex((currentIndex) => (currentIndex + 1) % bannerItems.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [bannerItems.length]);

  // Otomatik geçiş veya noktalara tıklama index'i değiştirdiğinde mobil
  // şeridi de oraya kaydır. Kullanıcının kendi kaydırması zaten index'i
  // güncelliyor, o durumda scrollLeft hedefte olduğu için no-op.
  useEffect(() => {
    const container = bannerScrollRef.current;
    if (!container) {
      return;
    }

    const target = activeBannerIndex * container.clientWidth;
    if (Math.abs(container.scrollLeft - target) < 8) {
      return;
    }

    bannerProgrammaticRef.current = true;
    container.scrollTo({ left: target, behavior: "smooth" });

    // Emniyet: scrollTo hiç kaydırma üretmezse onScroll tetiklenmez ve
    // bayrak sonsuza kadar açık kalırdı. Normal şartlarda bayrağı
    // kaydırma durduğunda onScroll temizliyor.
    const timeout = window.setTimeout(() => {
      bannerProgrammaticRef.current = false;
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [activeBannerIndex, bannerItems.length]);

  useEffect(() => {
    if (!isMounted || !activeAnnouncement) {
      return;
    }

    const storedVersion = readStoredCounterValue(announcementStorageKeys.version);

    if (storedVersion === activeAnnouncement.version) {
      return;
    }

    window.localStorage.setItem(
      announcementStorageKeys.version,
      String(activeAnnouncement.version),
    );
    window.localStorage.setItem(announcementStorageKeys.views, "0");
    notifyAnnouncementStorageChanged();
  }, [activeAnnouncement, announcementStorageKeys, isMounted]);

  const closeAnnouncementModal = useCallback(() => {
    if (!activeAnnouncement) {
      return;
    }

    const storedVersion = readStoredCounterValue(announcementStorageKeys.version);
    const currentViews =
      storedVersion === activeAnnouncement.version
        ? readStoredCounterValue(announcementStorageKeys.views)
        : 0;

    window.localStorage.setItem(
      announcementStorageKeys.version,
      String(activeAnnouncement.version),
    );
    window.localStorage.setItem(
      announcementStorageKeys.views,
      String(currentViews + 1),
    );
    notifyAnnouncementStorageChanged();
  }, [activeAnnouncement, announcementStorageKeys]);

  useEffect(() => {
    if (!isAnnouncementEligible || !activeAnnouncement) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAnnouncementModal();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeAnnouncement, closeAnnouncementModal, isAnnouncementEligible]);

  const fetchProductsPage = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      if (!analyticsSubdomain) {
        return;
      }

      setIsLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.set("subdomain", analyticsSubdomain);
        params.set("page", String(targetPage));

        if (debouncedSearchTerm.trim()) {
          params.set("q", debouncedSearchTerm.trim());
        }

        if (isDiscountCategorySelected) {
          params.set("discountOnly", "1");
        } else if (selectedCategoryIds) {
          params.set("categoryIds", [...selectedCategoryIds].join(","));
        }

        if (matchCategoryIds.length) {
          params.set("matchCategoryIds", matchCategoryIds.join(","));
        }

        if (productSort !== "featured") {
          params.set("sort", productSort);
        }

        const response = await fetch(`/api/storefront/products?${params.toString()}`);

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as { products: StorefrontProduct[]; total: number };
        setProducts((current) =>
          mode === "append" ? [...current, ...result.products] : result.products,
        );
        setProductTotal(result.total);
        setProductPage(targetPage);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [analyticsSubdomain, debouncedSearchTerm, isDiscountCategorySelected, selectedCategoryIds, matchCategoryIds, productSort],
  );

  useEffect(() => {
    if (isFirstProductFetch.current) {
      isFirstProductFetch.current = false;
      return;
    }

    if (sectionMode) {
      const normalizedSearch = debouncedSearchTerm.trim().toLocaleLowerCase("tr-TR");
      const filtered = initialProducts.filter((product) => {
        const matchesCategory = isDiscountCategorySelected
          ? (product.discount_percentage ?? 0) > 0
          : !selectedCategoryIds || selectedCategoryIds.has(product.category_id);

        if (!matchesCategory) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const normalizedName = product.product_name.toLocaleLowerCase("tr-TR");
        const normalizedSku = product.sku_code?.toLocaleLowerCase("tr-TR") ?? "";

        return normalizedName.includes(normalizedSearch) || normalizedSku.includes(normalizedSearch);
      });

      setProducts(filtered);
      setProductTotal(filtered.length);
      return;
    }

    void fetchProductsPage(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedCategoryId, productSort]);

  const handleLoadMoreProducts = useCallback(() => {
    if (sectionMode) {
      return;
    }

    void fetchProductsPage(productPage + 1, "append");
  }, [fetchProductsPage, productPage, sectionMode]);

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setHoveredCategoryId(null);
  }

  // Sepet tutarı bloğu iki yerde gösteriliyor: eski sabit sepet barı
  // (masaüstü/diğer bayiler) ve yeni mobil alt navigasyon. İndirim,
  // kampanya ve çoklu para birimi kuralları tek yerde kalsın diye hazır
  // düğüm olarak üretiliyor.
  const cartSummaryNode = (
    <div className="space-y-0.5">
      {cartPaymentSummary && cartPaymentSummary.finalTotal !== cartPaymentSummary.subtotal ? (
        <>
          <p className="truncate text-[11px] font-medium leading-tight text-slate-300 line-through">
            {formatCurrency(cartPaymentSummary.subtotal, cartPaymentSummary.currency)}
          </p>
          <p className={cn("truncate text-[13px] font-semibold leading-tight", theme.stickyCartText)}>
            {formatCurrency(cartPaymentSummary.finalTotal, cartPaymentSummary.currency)}
          </p>
        </>
      ) : cartDiscountSummary?.isQualified ? (
        <>
          <p className="truncate text-[11px] font-medium leading-tight text-slate-300 line-through">
            {formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency)}
          </p>
          <p className={cn("truncate text-[13px] font-semibold leading-tight", theme.stickyCartText)}>
            {formatCurrency(cartDiscountSummary.totalAfterDiscount, cartDiscountSummary.currency)}
          </p>
        </>
      ) : cartTotalEntries.length ? (
        cartTotalEntries.map(({ currency, total }) => (
          <p
            key={currency}
            className={cn("truncate text-[13px] font-semibold leading-tight", theme.stickyCartText)}
          >
            {currency}: {formatCurrency(total, currency)}
          </p>
        ))
      ) : (
        <p className={cn("truncate text-[13px] font-semibold leading-tight", theme.stickyCartText)}>
          {formatCurrency(cartTotal, cartCurrency)}
        </p>
      )}
    </div>
  );

  function handleSearchChange(value: string) {
    setSearchInput(value);
  }

  function openAddToCartFromDetail(product: StorefrontProduct) {
    if (!product.is_in_stock) {
      return;
    }

    closeProductDetail();
    handleOpenAddToCartModal(product.id);
  }

  function closeProductDetail() {
    descriptionAbortRef.current?.abort();
    descriptionAbortRef.current = null;
    setPreviewProduct(null);
    setActivePreviewTab(null);
    setPreviewDescription(undefined);
    setPreviewDescriptionLoading(false);
    setPreviewDescriptionError(null);
  }

  useEffect(() => {
    if (!previewProduct) {
      return;
    }

    const cachedDescription = descriptionCacheRef.current.get(previewProduct.id);

    if (cachedDescription !== undefined) {
      setPreviewDescription(cachedDescription);
      setPreviewDescriptionLoading(false);
      setPreviewDescriptionError(null);
      return;
    }

    if (!subdomain) {
      setPreviewDescription(null);
      setPreviewDescriptionLoading(false);
      setPreviewDescriptionError(t("productModal.detailLoadFailed"));
      return;
    }

    descriptionAbortRef.current?.abort();
    const abortController = new AbortController();
    descriptionAbortRef.current = abortController;

    setPreviewDescription(undefined);
    setPreviewDescriptionLoading(true);
    setPreviewDescriptionError(null);

    void (async () => {
      try {
        const response = await fetch("/api/storefront/product-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subdomain,
            productId: previewProduct.id,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage = t("productModal.detailLoadFailed");

          try {
            const result = await response.json();
            if (typeof result.error === "string" && result.error.trim()) {
              errorMessage = result.error;
            }
          } catch {
            // ignore non-JSON error bodies
          }

          if (!abortController.signal.aborted) {
            setPreviewDescriptionError(errorMessage);
            setPreviewDescriptionLoading(false);
          }

          return;
        }

        const result = await response.json();
        const description =
          typeof result.description === "string" ? result.description : null;

        descriptionCacheRef.current.set(previewProduct.id, description);

        if (!abortController.signal.aborted) {
          setPreviewDescription(description);
          setPreviewDescriptionLoading(false);
          setPreviewDescriptionError(null);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (!abortController.signal.aborted) {
          setPreviewDescriptionError(t("productModal.detailLoadFailed"));
          setPreviewDescriptionLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [previewProduct, subdomain, t]);

  function openCartDrawer() {
    setIsCartOpen(true);
  }

  function closeAddToCartModal() {
    setSelectedProduct(null);
    setSelectedQuantity("");
    setSelectedPackageCount("");
    setSelectedCartonCount("");
    setVariantSelections([]);
    setVariantSearchTerm("");
    setQuantityError(null);
  }

  function updateVariantSelection(
    variantId: string,
    nextSelection: Partial<VariantSelectionState> & Pick<VariantSelectionState, "variantId">,
  ) {
    setVariantSelections((current) => {
      const existing = current.find((item) => item.variantId === variantId);

      if (!existing) {
        return [
          ...current,
          {
            variantId,
            unit: nextSelection.unit ?? "adet",
            quantity: nextSelection.quantity ?? 0,
          },
        ];
      }

      return current.map((item) =>
        item.variantId === variantId
          ? {
              ...item,
              ...nextSelection,
            }
          : item,
      );
    });
  }

  function getVariantSelection(variantId: string) {
    return (
      variantSelections.find((item) => item.variantId === variantId) ?? {
        variantId,
        unit: "adet" as SalesUnit,
        quantity: 0,
      }
    );
  }

  async function validateVariantSelections(
    product: StorefrontProduct,
    selections: VariantSelectionState[],
  ) {
    if (!subdomain) {
      return { ok: true as const };
    }

    const response = await fetch("/api/storefront/variant-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subdomain,
        productId: product.id,
        selections: selections.map((selection) => ({
          variantId: selection.variantId,
          unit: selection.unit,
          quantity: selection.quantity,
        })),
      }),
    });

    if (response.ok) {
      return { ok: true as const };
    }

    const result = await response.json();
    return {
      ok: false as const,
      error: result.error ?? t("errors.variantStockFailed"),
    };
  }

  function confirmAddToCart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct || !selectedProduct.is_in_stock) {
      return;
    }

    if (selectedProduct.has_variants) {
      const selections = variantSelections.filter((selection) => selection.quantity > 0);

      if (!selections.length) {
        setQuantityError(t("errors.selectAtLeastOneModel"));
        return;
      }

      const invalidSelection = selections.find((selection) => {
        const variant = selectedProduct.variants.find((item) => item.id === selection.variantId);

        if (!variant || !variant.is_purchasable) {
          return true;
        }
        return false;
      });

      if (invalidSelection) {
        setQuantityError(t("errors.someModelsUnavailable"));
        return;
      }

      setQuantityError(null);

      void (async () => {
        const validation = await validateVariantSelections(selectedProduct, selections);

        if (!validation.ok) {
          setQuantityError(validation.error);
          return;
        }

        setCart((current) => {
          const withoutProduct = current.filter(
            (item) => item.product_id !== selectedProduct.id,
          );
          return addVariantSelectionsToCart(withoutProduct, selectedProduct, selections);
        });
        if (analyticsSubdomain) {
          trackStorefrontCartAdd(analyticsSubdomain, selectedProduct.id);
        }
        closeAddToCartModal();
        runCartFlight(selectedProduct.id, true);
      })();
      return;
    }

    if (
      selectedQuantityValue === null ||
      selectedPackageCountValue === null ||
      selectedCartonCountValue === null
    ) {
      setQuantityError(t("errors.enterValidNumbers"));
      return;
    }

    if (selectedTotalQuantity <= 0) {
      setQuantityError(t("errors.enterAtLeastOneValue"));
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === selectedProduct.id);
      if (existing) {
        return updateCartLineQuantity(current, selectedProduct.id, selectedTotalQuantity);
      }
      return addToCart(current, selectedProduct, selectedTotalQuantity);
    });
    if (analyticsSubdomain) {
      trackStorefrontCartAdd(analyticsSubdomain, selectedProduct.id);
    }
    closeAddToCartModal();
    runCartFlight(selectedProduct.id, true);
  }

  function dismissCampaignOnSurface(kind: CampaignKind, surface: CampaignSurface) {
    dismissCampaign(tenant.id, kind, surface);
    setCampaignDismissState((current) => ({
      ...current,
      [kind]: {
        ...current[kind],
        [surface]: true,
      },
    }));
  }

  function isCampaignDismissedOnSurface(kind: CampaignKind, surface: CampaignSurface) {
    return campaignDismissState[kind][surface];
  }

  function renderCampaignBarsForSurface(surface: CampaignSurface, compact = false) {
    const isCashDismissed = isCampaignDismissedOnSurface("cash", surface);
    const isCardDismissed = isCampaignDismissedOnSurface("card", surface);

    if (selectedPaymentMethod === "cash") {
      return isCashDismissed
        ? null
        : renderCashDiscountBar(compact, () => dismissCampaignOnSurface("cash", surface));
    }
    if (selectedPaymentMethod === "card") {
      return isCardDismissed
        ? null
        : renderCardCampaignBar(compact, () => dismissCampaignOnSurface("card", surface));
    }
    return (
      <>
        {!isCashDismissed &&
          renderCashDiscountBar(compact, () => dismissCampaignOnSurface("cash", surface))}
        {!isCardDismissed &&
          renderCardCampaignBar(compact, () => dismissCampaignOnSurface("card", surface))}
      </>
    );
  }

  const hasVisibleHomeCampaignBars =
    isMounted &&
    cart.length > 0 &&
    ((!isCampaignDismissedOnSurface("cash", "home") && cartDiscountSummary) ||
      (!isCampaignDismissedOnSurface("card", "home") && cartCardCampaignStatus));

  function renderCardCampaignBar(compact = false, onDismiss?: () => void) {
    if (!cartCardCampaignStatus) return null;
    const s = cartCardCampaignStatus;
    return (
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.55rem] p-4",
            theme.elevation1,
            theme.surfaceRing,
            s.isQualified ? theme.campaignBarQualified : theme.campaignBarPending,
          )}
        >
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={cn("absolute right-2 top-2 z-10", theme.modalCloseButton)}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </button>
          )}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl",
                compact ? "size-10" : "size-12",
                s.isQualified ? theme.campaignIconQualified : theme.campaignIconPending,
              )}
            >
              <CreditCard className={compact ? "size-4" : "size-5"} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-semibold uppercase tracking-[0.2em]",
                  compact ? "text-[10px]" : "text-[11px]",
                  s.isQualified ? theme.campaignLabelQualified : theme.campaignLabelPending,
                )}
              >
                {t("campaign.cardTitle")}
              </p>
              <p
                className={cn(
                  "mt-1 font-bold tracking-tight",
                  theme.text,
                  compact ? "text-sm leading-5" : "text-base leading-6",
                )}
              >
                {s.isQualified
                  ? s.nextTier
                    ? t("campaign.cardQualifiedWithNext", {
                        tier: s.appliedTier!.maxFreeInstallmentCount,
                        amount: formatCurrency(s.remainingAmount, s.currency),
                        nextTier: s.nextTier.maxFreeInstallmentCount,
                      })
                    : t("campaign.cardQualifiedNoNext", { tier: s.appliedTier!.maxFreeInstallmentCount })
                  : s.nextTier
                    ? t("campaign.cardUnqualifiedWithNext", {
                        amount: formatCurrency(s.remainingAmount, s.currency),
                        nextTier: s.nextTier.maxFreeInstallmentCount,
                      })
                    : t("campaign.cardUnqualifiedNoNext")}
              </p>
              <p
                className={cn(
                  "mt-1",
                  theme.textMuted,
                  compact ? "text-[11px] leading-4" : "text-sm leading-5",
                )}
              >
                {s.isQualified
                  ? t("campaign.cardSubtitleQualified", {
                      subtotal: formatCurrency(s.subtotal, s.currency),
                      tier: s.appliedTier!.maxFreeInstallmentCount,
                    })
                  : s.nextTier
                    ? t("campaign.cardSubtitleUnqualifiedWithNext", {
                        threshold: formatCurrency(s.nextTier.threshold, s.currency),
                        subtotal: formatCurrency(s.subtotal, s.currency),
                      })
                    : t("campaign.cardSubtitleUnqualifiedNoNext", {
                        subtotal: formatCurrency(s.subtotal, s.currency),
                      })}
              </p>
            </div>
          </div>
        </div>
    );
  }

  function renderCashDiscountBar(compact = false, onDismiss?: () => void) {
    if (!cartDiscountSummary) return null;

    const percentageLabel = formatDiscountPercentage(cartDiscountSummary.percentage);

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.55rem] p-4",
          theme.elevation1,
          theme.surfaceRing,
          cartDiscountSummary.isQualified
            ? theme.campaignBarQualified
            : theme.campaignBarPending,
        )}
      >
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn("absolute right-2 top-2 z-10", theme.modalCloseButton)}
            aria-label={t("common.close")}
          >
            <X className="size-4" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl",
              compact ? "size-10" : "size-12",
              cartDiscountSummary.isQualified
                ? theme.campaignIconQualified
                : theme.campaignIconPending,
            )}
          >
            <Sparkles className={compact ? "size-4.5" : "size-5"} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-semibold uppercase tracking-[0.2em]",
                compact ? "text-[10px]" : "text-[11px]",
                cartDiscountSummary.isQualified
                  ? theme.campaignLabelQualified
                  : theme.campaignLabelPending,
              )}
            >
              {t("campaign.cashTitle")}
            </p>
            <p
              className={cn(
                "mt-1 font-bold tracking-tight",
                theme.text,
                compact ? "text-sm leading-5" : "text-base leading-6",
              )}
            >
              {cartDiscountSummary.isQualified
                ? cartDiscountSummary.nextTier
                  ? t("campaign.cashQualifiedWithNext", {
                      percentage: percentageLabel,
                      amount: formatCurrency(cartDiscountSummary.remainingAmount, cartDiscountSummary.currency),
                      nextPercentage: formatDiscountPercentage(cartDiscountSummary.nextTier.percentage),
                    })
                  : t("campaign.cashQualifiedNoNext", { percentage: percentageLabel })
                : cartDiscountSummary.nextTier
                  ? t("campaign.cashUnqualifiedWithNext", {
                      amount: formatCurrency(cartDiscountSummary.remainingAmount, cartDiscountSummary.currency),
                      nextPercentage: formatDiscountPercentage(cartDiscountSummary.nextTier.percentage),
                    })
                  : t("campaign.cashUnqualifiedNoNext", { percentage: percentageLabel })}
            </p>
            <p
              className={cn(
                "mt-1",
                theme.textMuted,
                compact ? "text-[11px] leading-4" : "text-sm leading-5",
              )}
            >
              {cartDiscountSummary.isQualified
                ? t("campaign.cashSubtitleQualified", {
                    subtotal: formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency),
                    total: formatCurrency(cartDiscountSummary.totalAfterDiscount, cartDiscountSummary.currency),
                  })
                : cartDiscountSummary.nextTier
                  ? t("campaign.cashSubtitleUnqualifiedWithNext", {
                      threshold: formatCurrency(cartDiscountSummary.nextTier.threshold, cartDiscountSummary.currency),
                      subtotal: formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency),
                    })
                  : t("campaign.cashSubtitleUnqualifiedNoNext", {
                      subtotal: formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency),
                    })}
            </p>
            {storefrontSettings.cash_discount_note?.trim() && !compact ? (
              <p
                className={cn(
                  "mt-2 rounded-xl px-3 py-2 text-xs font-medium leading-5",
                  cartDiscountSummary.isQualified
                    ? theme.campaignNoteQualified
                    : theme.campaignNotePending,
                )}
              >
                {t("campaign.conditionPrefix")} {storefrontSettings.cash_discount_note}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderCrossSellCard(
    product: StorefrontProduct,
    compact = false,
    onOpenDetail?: (productId: string) => void,
  ) {
    // Sayı doğrudan sepetten: popup/şerit ürünleri ana katalog haritasında
    // olmayabiliyor, harita 0 döndürüp sayaç ve çizgiyi gizliyordu.
    const cartQuantity = product.has_variants
      ? getCartVariantCount(cart, product.id)
      : cartUnitTotalsByProductId.get(product.id) ?? 0;

    return (
      <article
        key={product.id}
        {...(onOpenDetail
          ? {
              role: "button" as const,
              tabIndex: 0,
              onClick: () => onOpenDetail(product.id),
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenDetail(product.id);
                }
              },
            }
          : {})}
        className={cn(
          "relative overflow-visible rounded-[1.5rem] p-3",
          compact ? "min-w-[128px] max-w-[128px] rounded-2xl p-2" : "min-w-[182px] max-w-[182px]",
          onOpenDetail && "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-current/50",
          theme.border,
          theme.productThumbSurface,
          theme.elevation1,
          theme.surfaceRing,
        )}
      >
        <StorefrontFloatingCartAction
          product={product}
          cartQuantity={cartQuantity}
          compact
          onIncrease={handleIncreaseCartItem}
          onDecrease={handleDecreaseCartItem}
          onOpenAddToCart={handleQuickAddOrOpenModal}
        />

        <CrossSellCardFx
          quantity={cartQuantity}
          sparkleClassName={theme.productImageSparkle}
          radius={compact ? 15 : 22}
        >
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.15rem]",
            compact ? "h-16 rounded-xl" : "h-28",
            theme.productImageWrap,
          )}
        >
          <DiscountSticker product={product} />
          {product.image_url ? (
            <StorefrontImage
              src={product.image_url}
              alt={product.product_name}
              className={cn("object-contain", compact ? "p-2" : "p-4")}
              sizes={STOREFRONT_CROSS_SELL_SIZES}
            />
          ) : (
            <div className={theme.emptyImage}>
              <ProductImagePlaceholder
                productName={product.product_name}
                iconClassName={cn(compact ? "size-4" : "size-6", theme.textMuted)}
                textClassName={cn(compact ? "text-[9px]" : "text-[10px]", theme.textMuted)}
              />
            </div>
          )}
        </div>
        </CrossSellCardFx>

        <div className={compact ? "mt-1.5 space-y-1" : "mt-3 space-y-1.5"}>
          <p
            className={cn(
              // Kompakt kartta 2 satır + küçük punto: uzun ürün adının en
              // azından büyük kısmı okunsun, müşteri resimden tahmin etmesin.
              compact
                ? "line-clamp-2 min-h-7 text-[10.5px] font-semibold leading-[13px]"
                : "line-clamp-2 text-sm font-semibold leading-5",
              theme.productThumbText,
            )}
          >
            {product.product_name}
          </p>
          {!compact && theme.showProductModelNo ? (
            <p className={cn("text-[11px]", theme.productThumbMeta)}>
              {formatProductModelNo(product.sku_code)}
            </p>
          ) : null}
          {!compact && getUnitSummary(product, t) ? (
            <p className={cn("line-clamp-2 text-[11px] leading-4", theme.productThumbMeta)}>
              {getUnitSummary(product, t)}
            </p>
          ) : null}
        </div>

        <div className={cn("flex items-end justify-between gap-2", compact ? "mt-1 [&_p]:!text-[11.5px] [&_p]:!leading-4" : "mt-3")}>
          <ProductPrice product={product} size="crossSell" />
        </div>
      </article>
    );
  }

  function renderProductPreviewModal() {
    if (!previewProduct) {
      return null;
    }

    const previewImages = [
      previewProduct.image_url,
      previewProduct.image_url_2,
      previewProduct.image_url_3,
    ].filter((url): url is string => Boolean(url));
    const activePreviewImage =
      previewImages[activePreviewImageIndex] ?? previewImages[0] ?? null;

    // Paket/koli sekmeleri market tipi mağazalarda hiç gösterilmez (bayi bu
    // alanları girmiyor — kullanıcı isteği, 4 Eyl 2026).
    const showPackagingTabs = !isMarketTenant;
    const tabItems: Array<{ key: ProductDetailTab; label: string }> = [
      { key: "details", label: t("productModal.tabDetails") },
      ...(showPackagingTabs && previewProduct.package_quantity
        ? [{ key: "package" as const, label: t("productModal.tabPackage") }]
        : []),
      ...(showPackagingTabs && previewProduct.carton_quantity
        ? [{ key: "carton" as const, label: t("productModal.tabCarton") }]
        : []),
    ];

    const detailContent = previewDescription;
    const packageContent = previewProduct.package_quantity
      ? t("productModal.packageEquals", { count: previewProduct.package_quantity })
      : t("productModal.packageMissing");
    const cartonContent = previewProduct.carton_quantity
      ? t("productModal.cartonEquals", { count: previewProduct.carton_quantity })
      : t("productModal.cartonMissing");

    const tabContent =
      activePreviewTab === "details" ? (
        previewDescriptionLoading ? (
          <p className={cn("text-sm leading-6", theme.textMuted)}>{t("productModal.detailLoading")}</p>
        ) : previewDescriptionError ? (
          <p className="text-sm leading-6 text-amber-700">{previewDescriptionError}</p>
        ) : (
          <ProductDescriptionContent content={detailContent ?? null} />
        )
      ) : activePreviewTab === "package" ? (
        <p className={cn("text-sm leading-6", theme.textMuted)}>{packageContent}</p>
      ) : activePreviewTab === "carton" ? (
        <p className={cn("text-sm leading-6", theme.textMuted)}>{cartonContent}</p>
      ) : null;

    return (
      <Modal
        open={Boolean(previewProduct)}
        onClose={closeProductDetail}
        title={t("productModal.title")}
        sheet
        contentScroll={false}
        closeButtonPosition="left"
        panelClassName={theme.modalPanel}
        headerClassName={theme.modalHeaderBorder}
        titleClassName={theme.modalTitle}
        closeButtonClassName={theme.modalCloseButton}
        footerClassName={theme.modalFooterBorder}
        handleClassName={theme.modalHandle}
        footer={
          <Button
            type="button"
            onClick={() => openAddToCartFromDetail(previewProduct)}
            disabled={!previewProduct.is_in_stock}
            className={cn(
              "h-12 w-full rounded-full text-base font-bold",
              theme.primaryButton,
              !previewProduct.is_in_stock && "cursor-not-allowed opacity-50",
            )}
          >
            {previewProduct.is_in_stock
              ? t(isTekel ? "product.addToCartPickup" : "product.addToCart")
              : t("product.soldOut")}
          </Button>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className={cn("relative h-52 shrink-0 overflow-hidden rounded-[1.75rem] sm:h-64", theme.productImageWrap)}>
            <DiscountSticker product={previewProduct} />
            {activePreviewImage ? (
              <StorefrontImage
                src={activePreviewImage}
                alt={previewProduct.product_name}
                className="object-contain p-6"
                sizes={STOREFRONT_MODAL_PRODUCT_SIZES}
              />
            ) : (
              <div className={theme.emptyImage}>
                <ProductImagePlaceholder
                  productName={previewProduct.product_name}
                  iconClassName={cn("size-10", theme.textMuted)}
                  textClassName={cn("text-sm", theme.textMuted)}
                />
              </div>
            )}
          </div>

          {previewImages.length > 1 ? (
            <div className="flex shrink-0 items-center justify-center gap-2">
              {previewImages.map((imageUrl, index) => (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() => setActivePreviewImageIndex(index)}
                  aria-label={`${previewProduct.product_name} fotoğraf ${index + 1}`}
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-xl border transition",
                    index === activePreviewImageIndex
                      ? "border-[var(--brand-primary,theme(colors.emerald.600))] ring-2 ring-[var(--brand-primary,theme(colors.emerald.400))] ring-offset-1"
                      : cn("opacity-60 hover:opacity-100", theme.border),
                  )}
                >
                  <StorefrontImage
                    src={imageUrl}
                    alt={`${previewProduct.product_name} fotoğraf ${index + 1}`}
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="shrink-0 space-y-1">
            <ProductPrice product={previewProduct} size="modal" />
            <h3 className={cn("text-lg font-semibold leading-6", theme.text)}>
              {previewProduct.product_name}
            </h3>
          </div>

          <div className="scrollbar-hide -mx-1 flex shrink-0 gap-2 overflow-x-auto px-1">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setActivePreviewTab((current) => (current === tab.key ? null : tab.key))
                }
                className={theme.modalTabChip(activePreviewTab === tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabContent ? (
            <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-y-contain", theme.modalSurface)}>
              {tabContent}
            </div>
          ) : null}

          {!activePreviewTab && pairPreviewProducts.length ? (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                {t("pair.goesWellWith")}
              </p>
              <div
                onWheel={(event) => {
                  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
                  event.currentTarget.scrollBy({ left: event.deltaY });
                  event.preventDefault();
                }}
                className="scrollbar-hide -mx-1 -mt-2 flex gap-2.5 overflow-x-auto px-1 pb-1 pt-2"
              >
                {pairPreviewProducts.map((product) =>
                  renderCrossSellCard(product, true, handleOpenProductDetail),
                )}
              </div>
            </div>
          ) : null}
          {!activePreviewTab && relatedPreviewProducts.length ? (
            <div className="shrink-0">
              <h3 className={cn("mb-2 text-sm font-bold tracking-tight", theme.text)}>
                {t("productModal.relatedProductsTitle")}
              </h3>
              <div className="relative">
                {/* -mt-2/pt-2: kartın üstünden taşan yüzen sepete-ekle rozetinin
                    (StorefrontFloatingCartAction) overflow-x-auto tarafından
                    üstten kırpılmasını önler — sepet çekmecesindeki aynı çözüm. */}
                <div
                  ref={relatedPreviewScrollRef}
                  onWheel={(event) => {
                    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
                    event.currentTarget.scrollBy({ left: event.deltaY });
                    event.preventDefault();
                  }}
                  className="scrollbar-hide -mx-1 -mt-2 flex gap-2.5 overflow-x-auto px-1 pb-1 pt-2"
                >
                  {relatedPreviewProducts.map((product) =>
                    renderCrossSellCard(product, true, handleOpenProductDetail),
                  )}
                </div>
                {relatedPreviewProducts.length > 2 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollRelatedPreview("left")}
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
                      onClick={() => scrollRelatedPreview("right")}
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
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }


  const resolvedProductCardClassName = cn(theme.productCard, productCardStyle.card);
  const resolvedProductImageWrapClassName = cn(
    theme.productImageWrap,
    productCardStyle.imageWrap,
  );

  return (
    <StorefrontThemeProvider
      themeKey={storefrontSettings.theme_key}
      brandPrimaryColor={storefrontSettings.brand_primary_color}
      brandAccentColor={storefrontSettings.brand_accent_color}
      productImageBackground={storefrontSettings.product_image_background}
    >
    <StorefrontLayoutProvider layoutKey={storefrontSettings.layout_key ?? "classic-grid"}>
    <div className="contents">
      {isClosedNow ? <StoreClosedOverlay nextOpening={closedNowNextOpening} /> : null}
      <StorefrontHeader
        orderTrackingHref={isMarketOrTekelTenant(tenant) ? "/siparislerim" : undefined}
        headerStyleKey={storefrontSettings.header_style_key ?? "standard"}
        storefrontSettings={storefrontSettings}
        storefrontTitle={storefrontTitle}
        isTekel={isTekel}
        tenantId={tenant.id}
        subdomain={subdomain}
        homeHref={homeHref}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        cartItemCount={badgeCartCount}
        cartTotalEntries={cartTotalEntries}
        cartTotal={cartTotal}
        cartCurrency={cartCurrency}
        cartLength={cart.length}
        onOpenCart={openCartDrawer}
        usesSidebarNav={usesSidebarNav}
        topCategories={topCategories}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedTopCategoryId={selectedTopCategoryId}
        selectedCategoryLabel={selectedCategoryLabel}
        mobileSubcategories={mobileSubcategories}
        mobileSubSubcategories={mobileSubSubcategories}
        hoveredCategoryId={hoveredCategoryId}
        onHoverCategory={setHoveredCategoryId}
        onCategoryChange={handleCategoryChange}
        onOpenCategoryDrawer={() => setIsCategoryDrawerOpen(true)}
        hideSearchAndCart={usesBottomNav}
        onOpenCampaigns={
          campaigns.length || customerCoupon
            ? () => {
                setIsSearchSheetOpen(false);
                setIsCampaignsSheetOpen(true);
              }
            : undefined
        }
      />

      {customerCoupon || campaigns.length ? (
        <StorefrontCouponBanner
          coupon={customerCoupon}
          campaigns={campaigns}
          onOpenCampaigns={() => {
            setIsSearchSheetOpen(false);
            setIsCampaignsSheetOpen(true);
          }}
        />
      ) : null}

      <main
        className={cn(
          "container-shell py-5 sm:py-6",
          // Alt navigasyon barı sayfanın üstünde durduğu için son ürünün
          // altında daha fazla boşluk gerekiyor (bkz. globals.css). Ama
          // altbilgi varsa boşluk ona ait (bottom-nav-footer-inset);
          // burada da verilirse ürünlerle altbilgi arasında koca bir
          // boşluk kalıyor.
          hasPageFooter
            ? "pb-4"
            : usesBottomNav
              ? "bottom-nav-safe-bottom"
              : "sticky-safe-bottom",
        )}
      >
        <div className={layout.catalogShellClass}>
          {usesSidebarNav ? (
            <StorefrontCategorySidebarSlot>
              <StorefrontCategorySidebar
                categories={categories}
                categoryTree={categoryTree}
                selectedCategoryId={selectedCategoryId}
                homeHref={homeHref}
                onCategoryChange={handleCategoryChange}
              />
            </StorefrontCategorySidebarSlot>
          ) : null}

          <StorefrontCatalogContent>
        {homepageBlocks
          .filter((block) => block.visible)
          .map((block) => {
            if (block.id === "hero") {
              return showHeroBlock ? (
                <StorefrontHeroBlock key="hero" settings={storefrontSettings} />
              ) : null;
            }

            if (block.id === "heroCluster") {
              return showHeroCluster ? (
                <StorefrontHeroCluster
                  key="heroCluster"
                  heroClusterItems={heroClusterItems}
                  storefrontTitle={storefrontTitle}
                />
              ) : null;
            }

            if (block.id === "categoryTiles") {
              // Noir mobilde bu blok bannerın altına taşınıyor (aşağıda
              // "banner" bloğunun render'ına bakın) — burada tekrar
              // gösterilmesin.
              return showCategoryTilesBlock && !showCategoryTilesOnMobileAfterBanner ? (
                <StorefrontCategoryTiles
                  key="categoryTiles"
                  categories={topCategories}
                  flatCategories={categories}
                  selectedCategoryId={selectedCategoryId}
                  products={products}
                  categoryRepresentativeImages={categoryRepresentativeImages}
                  onCategoryChange={handleCategoryChange}
                  // Market/tekel mobilde kategoriler 4'lü ızgara olarak
                  // kalmalı. Noir'in banner içine enjekte ettiği sürüm bunu
                  // zaten yapıyordu; enjeksiyonu kapatınca burada da
                  // vermezsek kutucuklar yatay kaydırıcıya dönüşüyor.
                  layout={usesMarketMobileOrder ? "grid4" : undefined}
                />
              ) : null;
            }

            if (block.id === "promoTiles") {
              // Market/tekel bayilerde indirim şeridi mobilde asıl istenen
              // bölüm; noir temanın mobilde ürünleri gizleme kuralından muaf.
              const hidePromo = hideHomeProductsOnMobile && !usesMarketMobileOrder;
              return showPromoTiles && !hidePromo ? (
                <StorefrontPromoTiles
                  key="promoTiles"
                  products={promoProducts}
                  totalCount={promoProductCount}
                  cartQuantityByProductId={cartQuantityByProductId}
                  cartVariantCountByProductId={cartVariantCountByProductId}
                  onIncrease={handleIncreaseCartItem}
                  onDecrease={handleDecreaseCartItem}
                  onSeeAll={
                    discountCategoryId
                      ? () => handleCategoryChange(discountCategoryId)
                      : undefined
                  }
                  onOpenDetail={handleOpenProductDetail}
                  onOpenAddToCart={handleQuickAddOrOpenModal}
                />
              ) : null;
            }

            if (block.id === "banner") {
              return showBannerSection ? (
                <Fragment key="banner">
                <section className="mb-5 sm:mb-10 w-full">
                  {bannerItems.length ? (
                    <div className="w-full space-y-4">
                      {/* Mobilde tüm banner'lar yan yana duran bir
                          scroll-snap şeridinde: parmakla kaydırılabiliyor
                          (kullanıcı isteği, 22 Ağu 2026). Masaüstünde
                          eskisi gibi tek banner render ediliyor. */}
                      {isMobileViewport ? (
                        <div
                          ref={bannerScrollRef}
                          // Padding YOK: clientWidth padding'i de sayıyor,
                          // slide genişliği saymıyor — ikisi eşit kalmazsa
                          // scrollLeft/clientWidth index hesabı kayıyor.
                          className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto"
                          onPointerDown={() => {
                            // Kullanıcı devraldı: hem otomatik geçişi sustur
                            // hem de sürmekte olan programatik kaydırmanın
                            // bayrağını düşür ki parmağı index'i sürebilsin.
                            bannerInteractionRef.current = Date.now();
                            bannerProgrammaticRef.current = false;
                          }}
                          onScroll={(event) => {
                            const element = event.currentTarget;

                            // Kaydırma durduğunda bayrağı temizle. Otomatik
                            // geçişin kendi kaydırması "kullanıcı dokundu"
                            // sayılırsa sonraki turu susturup kadansı
                            // 5 sn yerine 10 sn'ye çıkarıyordu.
                            if (bannerScrollEndTimerRef.current !== null) {
                              window.clearTimeout(bannerScrollEndTimerRef.current);
                            }
                            bannerScrollEndTimerRef.current = window.setTimeout(() => {
                              bannerProgrammaticRef.current = false;
                              bannerScrollEndTimerRef.current = null;
                            }, 140);

                            if (bannerProgrammaticRef.current) {
                              return;
                            }

                            // Parmak kalksa da atalet kaydırması sürüyor,
                            // o yüzden pointerdown'a ek olarak burada da.
                            bannerInteractionRef.current = Date.now();

                            if (!element.clientWidth) return;
                            const nextIndex = Math.round(
                              element.scrollLeft / element.clientWidth,
                            );
                            setActiveBannerIndex((currentIndex) =>
                              nextIndex !== currentIndex &&
                              nextIndex >= 0 &&
                              nextIndex < bannerItems.length
                                ? nextIndex
                                : currentIndex,
                            );
                          }}
                        >
                          {bannerItems.map((banner, index) => (
                            <div key={banner.id} className="w-full shrink-0 snap-start">
                              {renderBannerItem(
                                banner,
                                index,
                                selectedCategory?.name ?? storefrontTitle,
                                theme,
                                t,
                                usesMarketMobileOrder,
                              )}
                            </div>
                          ))}
                        </div>
                      ) : currentBanner ? (
                        renderBannerItem(
                          currentBanner,
                          activeBannerIndex,
                          selectedCategory?.name ?? storefrontTitle,
                          theme,
                          t,
                          usesMarketMobileOrder,
                        )
                      ) : null}
                      {bannerItems.length > 1 ? (
                        <div className="flex items-center justify-center gap-2">
                          {bannerItems.map((banner, index) => (
                            <button
                              key={banner.id}
                              type="button"
                              onClick={() => setActiveBannerIndex(index)}
                              className={cn(
                                "h-2.5 rounded-full transition",
                                index === activeBannerIndex
                                  ? cn("w-8", theme.indicatorActive)
                                  : cn("w-2.5", theme.indicatorInactive),
                              )}
                              aria-label={`Banner ${index + 1}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className={cn("flex min-h-[240px] w-full flex-col justify-center rounded-[2.5rem] px-6 py-10 text-center md:min-h-[320px] lg:min-h-[400px]", theme.border, theme.surfaceMuted)}>
                      <p className={cn("text-sm font-semibold", theme.text)}>{t("catalog.bannerEmpty")}</p>
                      <p className={cn("mt-2 text-sm", theme.textMuted)}>
                        {t("catalog.bannerEmptyHint")}
                      </p>
                    </div>
                  )}
                </section>
                {showCategoryTilesOnMobileAfterBanner ? (
                  // Alt boşluğu artık StorefrontCategoryTiles kendi veriyor
                  // (grid4 dahil); burada tekrar vermek çift boşluk yapardı.
                  <div className="sm:hidden">
                    <StorefrontCategoryTiles
                      categories={topCategories}
                      flatCategories={categories}
                      selectedCategoryId={selectedCategoryId}
                      products={products}
                      categoryRepresentativeImages={categoryRepresentativeImages}
                      onCategoryChange={handleCategoryChange}
                      layout="grid4"
                    />
                  </div>
                ) : null}
                </Fragment>
              ) : null;
            }

            if (block.id === "campaigns") {
              return hasVisibleHomeCampaignBars ? (
                <section key="campaigns" className="mb-5 hidden space-y-3 sm:mb-6 xl:block">
                  {renderCampaignBarsForSurface("home", false)}
                </section>
              ) : null;
            }

            if (block.id === "showcase") {
              // Noir mobilde tüm ürün blokları gizli olsa da vitrin
              // (admin'in seçtiği "öne çıkan ürünler") kategori kutucuklarının
              // hemen altında görünmeye devam etsin.
              if (!showSections && !showBestSellers) {
                return null;
              }

              return (
                <div key="showcase" className="mb-10 space-y-10">
                  {showSections ? sections.map((section) => {
                    const visibleSectionProducts = section.products.slice(0, 8);
                    const hasMore = section.products.length > 8;
                    const sectionHref = subdomain
                      ? getStorefrontSectionPath(section.id)
                      : null;

                    return (
                      <section key={section.id}>
                        <div className="mb-5 flex items-end justify-between gap-4">
                          <h2 className={cn("text-2xl font-bold tracking-tight sm:text-[2rem]", theme.text)}>
                            {section.title}
                          </h2>
                          {hasMore && sectionHref ? (
                            <a
                              href={sectionHref}
                              className={cn(
                                "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:opacity-90",
                                theme.border,
                                theme.surface,
                                theme.textMuted,
                              )}
                            >
                              Devamı →
                            </a>
                          ) : null}
                        </div>

                        <StorefrontProductListing
                          products={visibleSectionProducts}
                          cartQuantityByProductId={cartQuantityByProductId}
                          cartVariantCountByProductId={cartVariantCountByProductId}
                          productCardClassName={resolvedProductCardClassName}
                          productImageWrapClassName={resolvedProductImageWrapClassName}
                          gridClassName={layout.sectionProductGridClass}
                          onOpenDetail={handleOpenProductDetail}
                          onIncrease={handleIncreaseCartItem}
                          onDecrease={handleDecreaseCartItem}
                          onOpenAddToCart={handleQuickAddOrOpenModal}
                        />

                        {hasMore && sectionHref ? (
                          <div className="mt-6 flex justify-center">
                            <a
                              href={sectionHref}
                              className={cn(
                                "rounded-full px-8 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90 hover:shadow",
                                theme.border,
                                theme.surface,
                                theme.textMuted,
                              )}
                            >
                              {t("catalog.viewAllSectionProducts", { section: section.title, count: section.products.length })}
                            </a>
                          </div>
                        ) : null}
                      </section>
                    );
                  }) : null}

                  {showBestSellers ? (
                    <section>
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <h2 className={cn("text-2xl font-bold tracking-tight sm:text-[2rem]", theme.text)}>
                          {storefrontSettings.best_sellers_title}
                        </h2>
                      </div>

                      <StorefrontProductListing
                        products={visibleBestSellerProducts}
                        cartQuantityByProductId={cartQuantityByProductId}
                        cartVariantCountByProductId={cartVariantCountByProductId}
                        productCardClassName={resolvedProductCardClassName}
                        productImageWrapClassName={resolvedProductImageWrapClassName}
                        gridClassName={layout.sectionProductGridClass}
                        onOpenDetail={handleOpenProductDetail}
                        onIncrease={handleIncreaseCartItem}
                        onDecrease={handleDecreaseCartItem}
                        onOpenAddToCart={handleQuickAddOrOpenModal}
                      />
                    </section>
                  ) : null}
                </div>
              );
            }

            if (block.id === "banner2") {
              return showBanner2Section && currentBanner ? (
                <section key="banner2" className="mb-5 sm:mb-10 w-full">
                  <div className="w-full space-y-4">
                    {renderBannerItem(
                      currentBanner,
                      activeBannerIndex + 1,
                      selectedCategory?.name ?? storefrontTitle,
                      theme,
                      t,
                      usesMarketMobileOrder,
                    )}
                  </div>
                </section>
              ) : null;
            }

            if (block.id === "catalog") {
              return showCatalogBlock && !hideHomeProductsOnMobile ? (
                <section key="catalog" id="catalog-grid" className="scroll-mt-28 pt-1">
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h2 className={cn("text-2xl font-bold tracking-tight sm:text-[2rem]", theme.text)}>
                        {selectedCategoryId !== "all"
                          ? (categoryNameMap.get(selectedCategoryId) ?? t("catalog.products"))
                          : (pageTitle ?? t("header.allProducts"))}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      {!isMarketTenant && !sectionMode ? (
                        <div
                          role="group"
                          aria-label={t("catalog.sortLabel")}
                          className={cn(
                            "scrollbar-hide flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 shadow-sm",
                            theme.border,
                            theme.surface,
                          )}
                        >
                          {STOREFRONT_PRODUCT_SORTS.map((sortKey) => {
                            const isActive = productSort === sortKey;
                            return (
                              <button
                                key={sortKey}
                                type="button"
                                onClick={() => setProductSort(sortKey)}
                                aria-pressed={isActive}
                                className={cn(
                                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                                  isActive ? theme.primaryButton : cn("bg-transparent", theme.textMuted),
                                )}
                              >
                                {t(`catalog.sort.${sortKey}`)}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      <div className={cn("rounded-full px-4 py-2.5 text-sm shadow-sm", theme.border, theme.surface, theme.textMuted)}>
                        <span className={cn("font-semibold", theme.text)}>{productTotal}</span>{" "}
                        {t("catalog.foundSuffix")}
                      </div>
                      <div className={cn("rounded-full px-4 py-2.5 text-sm", theme.border, theme.surfaceMuted, theme.textMuted)}>
                        <span className={cn("font-semibold", theme.text)}>{visibleProducts.length}</span>{" "}
                        {t("catalog.showingSuffix")}
                      </div>
                    </div>
                  </div>

                  {productTotal ? (
                    <StorefrontProductListing
                      products={visibleProducts}
                      cartQuantityByProductId={cartQuantityByProductId}
                      cartVariantCountByProductId={cartVariantCountByProductId}
                      productCardClassName={resolvedProductCardClassName}
                      productImageWrapClassName={resolvedProductImageWrapClassName}
                      gridClassName={layout.productGridClass}
                      onOpenDetail={handleOpenProductDetail}
                      onIncrease={handleIncreaseCartItem}
                      onDecrease={handleDecreaseCartItem}
                      onOpenAddToCart={handleQuickAddOrOpenModal}
                    />
                  ) : (
                    <Card className={cn("rounded-[2rem] border-0 p-10 text-center", theme.surfaceMuted)}>
                      <p className="text-base font-semibold">{t("catalog.noMatchTitle")}</p>
                      <p className={cn("mt-1 text-sm", theme.textMuted)}>
                        {t("catalog.noMatchHint")}
                      </p>
                    </Card>
                  )}

                  {products.length < productTotal ? (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMoreProducts}
                        disabled={isLoadingProducts}
                        className={cn(
                          "rounded-full px-8 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90 hover:shadow disabled:opacity-60",
                          theme.border,
                          theme.surface,
                          theme.textMuted,
                        )}
                      >
                        {t("catalog.showMore", { count: productTotal - products.length })}
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null;
            }

            return null;
          })}
          </StorefrontCatalogContent>
        </div>
      </main>

      <AnimatePresence>
        {hasVisibleHomeCampaignBars ? (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed left-4 right-4 z-40 space-y-2 xl:hidden"
            style={{
              // Alt navigasyon barı varken sepet özeti satırı da
              // eklendiği için kampanya barları daha yukarı çıkmalı.
              bottom: usesBottomNav
                ? "calc(env(safe-area-inset-bottom) + 6.25rem)"
                : "calc(env(safe-area-inset-bottom) + 6.5rem)",
            }}
          >
            {renderCampaignBarsForSurface("home", true)}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isMounted && !usesBottomNav && cart.length && !isStickyCartBarDismissed && !isCartOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed safe-bottom-offset left-4 right-4 z-40 mx-auto max-w-lg xl:hidden"
          >
          <div className="relative">
            <div
              className={cn(
                theme.stickyCart,
                "!static w-full rounded-[1.5rem] px-3 py-2.5 text-left shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
              )}
            >
              <button type="button" onClick={openCartDrawer} className="w-full text-left">
                <div className="flex items-center gap-3">
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", theme.surfaceMuted)}>
                    <ShoppingCart className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold tracking-tight text-white">
                      {t("cart.orderSummary")}
                    </p>
                  </div>
                  <div className="min-w-0 text-right">{cartSummaryNode}</div>
                  <span
                    className={cn(
                      theme.stickyCartButton,
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(16,185,129,0.22)]",
                    )}
                  >
                    {t("stickyCart.continue")}
                  </span>
                </div>
              </button>
            </div>
            <button
              type="button"
              aria-label={t("stickyCart.closeAria")}
              onClick={(event) => {
                event.stopPropagation();
                setIsStickyCartBarDismissed(true);
              }}
              className={cn(
                "absolute -right-2 -top-2.5 z-10 flex size-8 items-center justify-center",
                theme.cartDrawerCloseButton,
              )}
            >
              <X className="size-4" />
            </button>
          </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isMounted && usesBottomNav ? (
        <StorefrontBottomNav
          cartItemCount={badgeCartCount}
          isTekel={isTekel}
          isSearchOpen={isSearchSheetOpen}
          isCampaignsOpen={isCampaignsSheetOpen}
          onOpenSearch={() => {
            setIsCampaignsSheetOpen(false);
            setIsSearchSheetOpen(true);
          }}
          onOpenCart={() => {
            setIsSearchSheetOpen(false);
            setIsCampaignsSheetOpen(false);
            openCartDrawer();
          }}
          onOpenCampaigns={() => {
            setIsSearchSheetOpen(false);
            setIsCampaignsSheetOpen(true);
          }}
        />
      ) : null}

      {isMounted && usesBottomNav ? (
        <StorefrontSearchSheet
          isOpen={isSearchSheetOpen && !isCartOpen && !isCampaignsSheetOpen}
          value={searchInput}
          resultCount={productTotal}
          onChange={handleSearchChange}
          onClose={() => {
            // X'e basınca aramayı da iptal et — yoksa yazılan kelime state'te
            // kalıp kategori tıklamalarında süzmeye devam ediyordu (kullanıcı
            // isteği, 4 Eyl 2026). Bu yüzey yalnız market/tekelde var.
            setIsSearchSheetOpen(false);
            setSearchInput("");
          }}
        />
      ) : null}

      {/* "Bunları unutmuş olabilirsiniz" hatırlatması artık sepet çekmecesinin
          2. adımında (market/tekel adımlı akış); ayrı popup kaldırıldı. */}

      <StorefrontCampaignsSheet
        isOpen={isMounted && isCampaignsSheetOpen}
        onClose={() => setIsCampaignsSheetOpen(false)}
        campaigns={campaigns}
        campaignStatus={campaignStatus}
        cartItems={cart}
        excludedByCampaign={excludedCategoriesByCampaign}
        categoryNameById={categoryNameMap}
        currency={campaignStatus?.currency ?? cartCurrency}
        onOpenCategory={handleCategoryChange}
        paymentCampaignBars={
          hasVisibleHomeCampaignBars ? renderCampaignBarsForSurface("home", false) : null
        }
        personalCoupon={customerCoupon}
        personalCouponStatus={
          cartPaymentSummary
            ? { applied: cartPaymentSummary.couponDiscountAmount, missing: cartPaymentSummary.couponMissingAmount }
            : null
        }
      />

      {usesSidebarNav ? (
        <StorefrontCategoryDrawer
          isOpen={isCategoryDrawerOpen}
          onClose={() => setIsCategoryDrawerOpen(false)}
          categories={categories}
          categoryTree={categoryTree}
          selectedCategoryId={selectedCategoryId}
          homeHref={homeHref}
          onCategoryChange={handleCategoryChange}
        />
      ) : null}

      <StorefrontCartDrawer
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setCartSuggestionsSnapshot([]);
        }}
        cart={cart}
        setCart={setCart}
        cartDistinctCount={cartDistinctCount}
        cartItemCount={badgeCartCount}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        selectedInstallmentCount={selectedInstallmentCount}
        setSelectedInstallmentCount={setSelectedInstallmentCount}
        paymentMethodError={paymentMethodError}
        setPaymentMethodError={setPaymentMethodError}
        storefrontSettings={storefrontSettings}
        note={note}
        setNote={setNote}
        customerReferenceName={customerReferenceName}
        setCustomerReferenceName={setCustomerReferenceName}
        customerReferenceNameError={customerReferenceNameError}
        setCustomerReferenceNameError={setCustomerReferenceNameError}
        customerAddress={customerAddress}
        customerLocation={customerLocation}
        shareLocation={shareLocation}
        locationStatus={locationStatus}
        onToggleLocation={toggleShareLocation}
        setCustomerAddress={setCustomerAddress}
        customerAddressError={customerAddressError}
        setCustomerAddressError={setCustomerAddressError}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerPhoneError={customerPhoneError}
        setCustomerPhoneError={setCustomerPhoneError}
        isMarketTenant={isMarketTenant}
        isTekel={isTekel}
        recommendedProducts={recommendedProducts}
        cartPaymentSummary={cartPaymentSummary}
        cartDiscountSummary={cartDiscountSummary}
        cartTotalEntries={cartTotalEntries}
        cartTotal={cartTotal}
        cartCurrency={cartCurrency}
        isMinCartAmountMet={isMinCartAmountMet}
        minCartAmountRemaining={minCartAmountRemaining}
        deliveryFeeAmount={deliveryFeeAmount}
        deliveryFeeRemaining={deliveryFeeRemaining}
        onWhatsAppOrder={handleWhatsAppOrder}
        isGeneratingOrderPdf={isGeneratingOrderPdf}
        orderPdfError={orderPdfError}
        whatsappHandoff={whatsappHandoff}
        onClearWhatsappHandoff={clearWhatsappHandoff}
        cartStorageKey={cartStorageKey}
        stickyCartButtonClassName={theme.stickyCartButton}
        isCashCampaignDismissedOnCart={isCampaignDismissedOnSurface("cash", "cart")}
        isCardCampaignDismissedOnCart={isCampaignDismissedOnSurface("card", "cart")}
        onDismissCashCampaignOnCart={() => dismissCampaignOnSurface("cash", "cart")}
        onDismissCardCampaignOnCart={() => dismissCampaignOnSurface("card", "cart")}
        renderCashDiscountBar={renderCashDiscountBar}
        renderCardCampaignBar={renderCardCampaignBar}
        renderCrossSellCard={renderCrossSellCard}
        recommendedOverride={complementProducts.length ? complementProducts : null}
        recommendedOverrideTitle={t("pair.forgotTitle")}
        frozenSuggestions={cartSuggestionsSnapshot}
        onSnapshotSuggestions={() =>
          setCartSuggestionsSnapshot(
            complementProducts.length ? complementProducts : recommendedProducts,
          )
        }
        checkoutValidationNonce={checkoutValidationNonce}
        onGoHome={() => {
          // "Ücretsiz teslimat için ... ekleyin" ipucundan: çekmeceyi kapat,
          // ana katalog görünümüne dön ki müşteri ürün eklesin.
          setIsCartOpen(false);
          setCartSuggestionsSnapshot([]);
          setSearchInput("");
          handleCategoryChange("all");
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        isCatalogOnly={isCatalogOnly}
      />
      {renderProductPreviewModal()}

      {showBusyModal ? (
        <AnnouncementModal
          key="busy-mode"
          announcement={{
            title: "Şu anda yoğunuz",
            body: busyNote,
            version: 0,
            maxDisplayCount: 1,
          }}
          onDismiss={dismissBusyModal}
          badgeLabel="Bilgilendirme"
        />
      ) : null}

      {!showBusyModal && isAnnouncementEligible && activeAnnouncement ? (
        <AnnouncementModal
          key={announcementRenderKey ?? activeAnnouncement.version}
          announcement={activeAnnouncement}
          onDismiss={closeAnnouncementModal}
        />
      ) : null}

      <Modal
        open={Boolean(selectedProduct)}
        onClose={closeAddToCartModal}
        title={
          selectedProduct?.has_variants
            ? t("product.selectModel")
            : t(isTekel ? "product.addToCartPickup" : "product.addToCart")
        }
        contentScroll={!selectedProduct?.has_variants}
        sheet={Boolean(selectedProduct?.has_variants)}
        panelClassName={theme.modalPanel}
        headerClassName={theme.modalHeaderBorder}
        titleClassName={theme.modalTitle}
        closeButtonClassName={theme.modalCloseButton}
        footerClassName={theme.modalFooterBorder}
        handleClassName={theme.modalHandle}
        footer={
          selectedProduct?.has_variants ? (
            <div className="space-y-3">
              <div className={cn("rounded-xl p-3", theme.cartDrawerSummary)}>
                <p className={cn("text-xs", theme.cartDrawerMuted)}>{t("addToCart.selectedModels")}</p>
                <p className={cn("mt-0.5 text-xs", theme.cartDrawerMuted)}>
                  {t("product.modelCount", { count: selectedVariantSummary.count })}
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(selectedVariantSummary.total, selectedProduct.currency)}
                </p>
              </div>
              <Button
                type="submit"
                form="add-to-cart-form"
                className="flex h-11 w-full rounded-full text-sm font-bold sm:h-auto sm:w-auto sm:rounded-lg sm:px-4 sm:py-2.5"
              >
                {t(isTekel ? "product.addToCartPickup" : "product.addToCart")}
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              form="add-to-cart-form"
              className="flex h-11 w-full rounded-full text-sm font-bold sm:h-auto sm:w-auto sm:rounded-lg sm:px-4 sm:py-2.5"
            >
              {t(isTekel ? "product.addToCartPickup" : "product.addToCart")}
            </Button>
          )
        }
      >
        {selectedProduct ? (
          <form
            id="add-to-cart-form"
            onSubmit={confirmAddToCart}
            className={cn(
              "w-full min-w-0 max-w-full",
              selectedProduct.has_variants
                ? "flex min-h-0 flex-1 flex-col gap-2"
                : "grid gap-4",
            )}
          >
            <div
              className={cn(
                "w-full min-w-0 max-w-full shrink-0 rounded-xl px-3",
                theme.border,
                theme.surfaceMuted,
                selectedProduct.has_variants ? "py-2" : "py-2.5",
              )}
            >
              <div className="flex w-full min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "break-words text-pretty font-semibold",
                      theme.text,
                      selectedProduct.has_variants
                        ? "line-clamp-2 text-[13px] leading-5"
                        : "line-clamp-3 text-[13px] leading-5",
                    )}
                  >
                    {selectedProduct.product_name}
                  </p>
                  {theme.showProductModelNo ? (
                    <p className={cn("mt-0.5 truncate text-[11px]", theme.textMuted)}>
                      {formatProductModelNo(selectedProduct.sku_code)}
                    </p>
                  ) : null}
                  {!selectedProduct.has_variants && getUnitSummary(selectedProduct, t) ? (
                    <p className={cn("mt-0.5 text-[11px]", theme.textMuted)}>
                      {getUnitSummary(selectedProduct, t)}
                    </p>
                  ) : null}
                </div>
                <ProductPrice product={selectedProduct} size="compact" />
              </div>
            </div>

            {selectedProduct.has_variants ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className={cn("relative shrink-0 pb-2.5", theme.surface)}>
                  <Search className={cn("pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2", theme.textMuted)} />
                  <Input
                    value={variantSearchTerm}
                    onChange={(event) => setVariantSearchTerm(event.target.value)}
                    placeholder={t("addToCart.searchPlaceholder")}
                    className="h-9 rounded-lg pl-9 pr-3 text-[16px]"
                  />
                </div>

                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-y-contain py-2 pr-1">
                  {filteredSelectedVariants.length ? (
                    filteredSelectedVariants.map((variant) => {
                      const selection = getVariantSelection(variant.id);
                      const unitChoices = salesUnits.filter((unitOption) => {
                        if (unitOption.value === "paket") {
                          return Boolean(variant.package_quantity);
                        }

                        if (unitOption.value === "koli") {
                          return Boolean(variant.carton_quantity);
                        }

                        return true;
                      });
                      const isUnavailable = !variant.is_purchasable;

                      return (
                        <div
                          key={variant.id}
                          className={cn(
                            "rounded-xl px-2.5 py-2 transition",
                            isUnavailable
                              ? cn("opacity-40", theme.surfaceMuted)
                              : cn(theme.elevation1, theme.surface),
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("truncate pr-2 text-sm font-bold leading-5 tracking-tight", theme.text)}>
                              {variant.model_name}
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                              {variant.price !== null ? (
                                <ProductPrice
                                  product={{
                                    price: variant.price,
                                    original_price: variant.original_price,
                                    currency: selectedProduct.currency,
                                  }}
                                  size="compact"
                                />
                              ) : null}
                              {isUnavailable ? (
                                <Badge className={cn("px-2 py-1 text-[10px]", theme.surfaceMuted, theme.textMuted)}>
                                  {t("product.soon")}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-1.5 grid gap-2 sm:mt-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <select
                              value={selection.unit}
                              disabled={isUnavailable}
                              onChange={(event) => {
                                updateVariantSelection(variant.id, {
                                  variantId: variant.id,
                                  unit: event.target.value as SalesUnit,
                                  quantity: 0,
                                });
                                if (quantityError) {
                                  setQuantityError(null);
                                }
                              }}
                              className={cn(
                                "h-9 rounded-lg px-2.5 py-0 text-[16px] leading-9 disabled:opacity-60",
                                theme.formField,
                                theme.surface,
                                theme.text,
                              )}
                              style={{ fontSize: "16px" }}
                            >
                              {unitChoices.map((unitOption) => (
                                <option key={unitOption.value} value={unitOption.value}>
                                  {unitOption.value === "adet"
                                    ? t("unit.piece")
                                    : unitOption.value === "paket"
                                      ? t("unit.package")
                                      : t("unit.carton")}
                                </option>
                              ))}
                            </select>
                            <QuantityStepper
                              disabled={isUnavailable}
                              value={
                                selection.quantity > 0
                                  ? String(selection.quantity)
                                  : ""
                              }
                              onChange={(nextValue) => {
                                const nextQuantity = parseUnitCount(nextValue);
                                if (nextQuantity === null && nextValue.trim() !== "") {
                                  return;
                                }
                                updateVariantSelection(variant.id, {
                                  variantId: variant.id,
                                  quantity:
                                    nextQuantity && nextQuantity > 0
                                      ? nextQuantity
                                      : 0,
                                });
                                if (quantityError) {
                                  setQuantityError(null);
                                }
                              }}
                              placeholder="0"
                              ariaLabel={t("addToCart.variantQuantityAria", { model: variant.model_name })}
                            />
                          </div>

                          <div className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] leading-4 sm:mt-1.5 sm:text-[10px]", theme.textMuted)}>
                            {variant.package_quantity ? (
                              <span className="line-clamp-1">{t("addToCart.packageEqualsShort", { count: variant.package_quantity })}</span>
                            ) : null}
                            {variant.carton_quantity ? (
                              <span className="line-clamp-1">{t("addToCart.cartonEqualsShort", { count: variant.carton_quantity })}</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={cn("rounded-lg px-4 py-5 text-center text-sm", theme.surfaceMuted, theme.textMuted)}>
                      {variantSearchTerm.trim()
                        ? t("addToCart.noModelFoundQuery", { query: variantSearchTerm.trim() })
                        : t("addToCart.noModelFound")}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid w-full min-w-0 max-w-full gap-3 sm:grid-cols-3">
                <div className="min-w-0 space-y-2">
                  <label className={cn("text-sm font-semibold", theme.text)}>{t("addToCart.quantityLabel")}</label>
                  <QuantityStepper
                    value={selectedQuantity}
                    onChange={(nextValue) => {
                      setSelectedQuantity(nextValue);
                      if (quantityError) {
                        setQuantityError(null);
                      }
                    }}
                    placeholder="0"
                    ariaLabel={t("addToCart.quantityAria")}
                  />
                </div>

                {selectedProduct.package_quantity ? (
                  <div className="min-w-0 space-y-2">
                    <label className={cn("text-sm font-semibold", theme.text)}>
                      {t("addToCart.packageLabel")}
                    </label>
                    <QuantityStepper
                      value={selectedPackageCount}
                      onChange={(nextValue) => {
                        setSelectedPackageCount(nextValue);
                        if (quantityError) {
                          setQuantityError(null);
                        }
                      }}
                      placeholder="0"
                      ariaLabel={t("addToCart.packageAria")}
                    />
                    <p className={cn("text-xs", theme.textMuted)}>
                      {t("productModal.packageEquals", { count: selectedProduct.package_quantity })}
                    </p>
                  </div>
                ) : null}

                {selectedProduct.carton_quantity ? (
                  <div className="min-w-0 space-y-2">
                    <label className={cn("text-sm font-semibold", theme.text)}>{t("addToCart.cartonLabel")}</label>
                    <QuantityStepper
                      value={selectedCartonCount}
                      onChange={(nextValue) => {
                        setSelectedCartonCount(nextValue);
                        if (quantityError) {
                          setQuantityError(null);
                        }
                      }}
                      placeholder="0"
                      ariaLabel={t("addToCart.cartonAria")}
                    />
                    <p className={cn("text-xs", theme.textMuted)}>
                      {t("productModal.cartonEquals", { count: selectedProduct.carton_quantity })}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {quantityError ? (
              <p className="shrink-0 text-xs text-amber-700">{quantityError}</p>
            ) : null}

            {!selectedProduct.has_variants ? (
              <div className={cn("w-full min-w-0 max-w-full shrink-0 rounded-xl p-3", theme.cartDrawerSummary)}>
                <p className={cn("text-xs", theme.cartDrawerMuted)}>{t("cart.total")}</p>
                <p className={cn("mt-0.5 text-xs", theme.cartDrawerMuted)}>{t("crossSell.unitCount", { count: selectedTotalQuantity })}</p>
                <p className="mt-1 break-words text-xl font-bold">
                  {formatCurrency(selectedLineTotal, selectedProduct.currency)}
                </p>
              </div>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </div>
    </StorefrontLayoutProvider>
    </StorefrontThemeProvider>
  );
}