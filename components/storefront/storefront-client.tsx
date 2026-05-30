"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ChevronDown,
  CreditCard,
  Megaphone,
  Search,
  ShoppingCart,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  buildCategoryTree,
  getCategoryLineage,
  getDescendantCategoryIds,
} from "@/lib/categories/tree";
import { supportedCurrencyCodes } from "@/lib/products/constants";
import {
  buildWhatsAppMessage,
  CartDiscountConfig,
  formatDiscountPercentage,
  getCartCardCampaignStatus,
  getCartCurrency,
  getCartDiscountSummary,
  getCartPaymentSummary,
  getCartTotal,
  getCartTotalsByCurrency,
  getCartVariantCount,
  updateCartLineQuantity,
} from "@/lib/storefront/cart";
import { storefrontThemes } from "@/lib/storefront/themes";
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
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import {
  trackStorefrontCartAdd,
  trackStorefrontProductView,
  trackStorefrontVisit,
} from "@/lib/storefront/analytics";
import { StorefrontCartDrawer } from "@/components/storefront/storefront-cart-drawer";
import { ProductDescriptionContent } from "@/components/storefront/product-description-content";
import {
  DiscountSticker,
  ProductPrice,
  StorefrontFloatingCartAction,
  StorefrontProductCard,
} from "@/components/storefront/storefront-product-card";

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
          is_in_stock: product.is_in_stock && variant.is_purchasable,
          currency: product.currency,
          price: product.price,
          package_quantity: variant.package_quantity,
          carton_quantity: variant.carton_quantity,
          stock_quantity: variant.stock_quantity,
          quantity: requestedUnits,
          sales_unit: selection.unit,
          unit_quantity: selection.quantity,
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

function getUnitSummary(product: StorefrontProduct) {
  const parts: string[] = [];

  if (product.package_quantity) {
    parts.push(`Paket: ${product.package_quantity} adet`);
  }

  if (product.carton_quantity) {
    parts.push(`Koli: ${product.carton_quantity} adet`);
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
) {
  return (
    <div
      key={banner.id}
      className="relative w-full overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
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
        className="absolute inset-0 hidden bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%)] md:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_60%)] md:block"
      />
      <div className="relative aspect-[3/1] bg-transparent md:min-h-[340px] md:aspect-auto lg:min-h-[400px]">
        {banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.title ?? `${title} banner`}
            fill
            className="object-cover object-center"
            sizes="100vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center p-8 text-center text-white/70 sm:min-h-[220px] md:min-h-[340px] lg:min-h-[400px]">
            <div>
              <p className="text-lg font-semibold sm:text-xl">Banner görseli eklenmedi</p>
              <p className="mt-2 text-sm leading-6 sm:text-base">
                Yönetim panelinden bu segmente banner görseli yükleyebilirsiniz.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
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
}: {
  announcement: ActiveAnnouncement;
  onDismiss: () => void;
}) {
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
            aria-label="Duyuru modalını kapat"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.16),transparent_34%),rgba(2,6,23,0.60)] backdrop-blur-md"
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/95 shadow-[0_36px_120px_rgba(15,23,42,0.30)] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            aria-describedby="announcement-modal-body"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-emerald-500/18 via-cyan-500/18 to-sky-500/18" />
              <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-emerald-400/14 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-sky-400/14 blur-3xl" />
            </div>

            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(14,165,233,0.16))] text-emerald-700 ring-1 ring-emerald-100">
                    <Megaphone className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Yeni Duyuru
                    </span>
                    <h2
                      id="announcement-modal-title"
                      className="text-2xl font-black tracking-tight text-slate-950 sm:text-[2.2rem]"
                    >
                      {announcement.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-full border border-slate-200/80 bg-white/90 p-2.5 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                  aria-label="Kapat"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
                <div className="mb-4 h-px w-full bg-gradient-to-r from-emerald-200 via-sky-200 to-transparent" />
                <p
                  id="announcement-modal-body"
                  className="whitespace-pre-line text-[15px] leading-8 text-slate-600 sm:text-base"
                >
                  {announcement.body}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={handleDismiss}
                  className="h-12 rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#0f766e_100%)] px-7 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:scale-[1.01] hover:shadow-[0_22px_48px_rgba(15,23,42,0.28)]"
                >
                  Anladım
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

const salesUnits: Array<{ value: SalesUnit; label: string }> = [
  { value: "adet", label: "Adet" },
  { value: "paket", label: "Paket" },
  { value: "koli", label: "Koli" },
];

export function StorefrontClient({
  tenant,
  categories,
  products,
  storefrontSettings,
  sections = [],
  subdomain,
  pageTitle,
  homeHref,
}: {
  tenant: Tenant;
  categories: Category[];
  products: StorefrontProduct[];
  storefrontSettings: TenantStorefrontSettings;
  sections?: StorefrontSectionWithProducts[];
  subdomain?: string;
  pageTitle?: string;
  homeHref?: string;
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
  const [note, setNote] = useState("");
  const [customerReferenceName, setCustomerReferenceName] = useState("");
  const [customerReferenceNameError, setCustomerReferenceNameError] = useState<string | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<StorefrontProduct | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<ProductDetailTab>("details");
  const [previewDescription, setPreviewDescription] = useState<string | null | undefined>(
    undefined,
  );
  const [previewDescriptionLoading, setPreviewDescriptionLoading] = useState(false);
  const [previewDescriptionError, setPreviewDescriptionError] = useState<string | null>(null);
  const descriptionCacheRef = useRef(new Map<string, string | null>());
  const descriptionAbortRef = useRef<AbortController | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState("0");
  const [selectedPackageCount, setSelectedPackageCount] = useState("0");
  const [selectedCartonCount, setSelectedCartonCount] = useState("0");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [variantSelections, setVariantSelections] = useState<VariantSelectionState[]>([]);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | null>(null);
  const [selectedInstallmentCount, setSelectedInstallmentCount] = useState<number | null>(null);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  const [isGeneratingOrderPdf, setIsGeneratingOrderPdf] = useState(false);
  const [campaignDismissState, setCampaignDismissState] = useState<CampaignDismissBySurface>(
    () => readInitialCampaignDismissState(tenant.id),
  );
  const isMounted = useSyncExternalStore(
    subscribeToMountState,
    getClientMountedState,
    getServerMountedState,
  );
  const analyticsSubdomain = subdomain ?? tenant.subdomain;

  const theme = storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;
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
  const mobileSubcategories = useMemo(() => {
    if (!selectedTopCategory) {
      return [];
    }

    return selectedTopCategory.children.map((child) => ({
      id: child.id,
      name: child.name,
    }));
  }, [selectedTopCategory]);

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);
  const cartCurrency = useMemo(() => getCartCurrency(cart), [cart]);
  const cartTotalsByCurrency = useMemo(() => getCartTotalsByCurrency(cart), [cart]);
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
  const cartPaymentSummary = useMemo(() => {
    if (!selectedPaymentMethod || !cart.length) return null;

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
    );
  }, [
    cart,
    selectedPaymentMethod,
    selectedInstallmentCount,
    storefrontSettings.cash_discount_tiers,
    storefrontSettings.is_cash_discount_active,
    storefrontSettings.card_campaign_tiers,
    storefrontSettings.is_card_campaign_active,
    storefrontSettings.card_installment_options,
  ]);
  const cartQuantityByProductId = useMemo(
    () => new Map(cart.map((item) => [item.id, item.quantity])),
    [cart],
  );
  const cartVariantCountByProductId = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, getCartVariantCount(cart, product.id)]),
      ),
    [cart, products],
  );
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

  const productSearchIndex = useMemo(
    () =>
      products.map((product) => ({
        product,
        normalizedName: product.product_name.toLocaleLowerCase("tr-TR"),
        normalizedSku: product.sku_code?.toLocaleLowerCase("tr-TR") ?? "",
        normalizedLineage: getCategoryLineage(categories, product.category_id)
          .map((item) => item.name.toLocaleLowerCase("tr-TR"))
          .join(" "),
      })),
    [categories, products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLocaleLowerCase("tr-TR");

    return productSearchIndex
      .filter(({ product, normalizedName, normalizedSku, normalizedLineage }) => {
        const matchesCategory =
          !selectedCategoryIds || selectedCategoryIds.has(product.category_id);
        const matchesSearch =
          !normalizedSearch ||
          normalizedName.includes(normalizedSearch) ||
          normalizedSku.includes(normalizedSearch) ||
          normalizedLineage.includes(normalizedSearch);

        return matchesCategory && matchesSearch;
      })
      .map(({ product }) => product);
  }, [debouncedSearchTerm, productSearchIndex, selectedCategoryIds]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const handleOpenProductDetail = useCallback(
    (productId: string) => {
      const product = productsById.get(productId);

      if (!product) {
        return;
      }

      setPreviewProduct(product);
      setActivePreviewTab("details");

      if (analyticsSubdomain) {
        trackStorefrontProductView(tenant.id, analyticsSubdomain, product.id);
      }
    },
    [analyticsSubdomain, productsById, tenant.id],
  );

  const handleIncreaseCartItem = useCallback((productId: string) => {
    setCart((current) => {
      const currentQuantity = current.find((item) => item.id === productId)?.quantity ?? 0;
      return updateCartLineQuantity(current, productId, currentQuantity + 1);
    });
  }, []);

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
        setSelectedQuantity("0");
        setSelectedPackageCount("0");
        setSelectedCartonCount("0");
        return;
      }

      const existingItem = currentCart.find((item) => item.id === product.id);
      setSelectedQuantity(String(existingItem?.quantity ?? 0));
      setSelectedPackageCount("0");
      setSelectedCartonCount("0");
      setVariantSelections([]);
    },
    [productsById],
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const bannerItems = storefrontSettings.banner_items ?? [];
  const currentBanner = bannerItems[activeBannerIndex] ?? null;
  const showBannerSection = !homeHref && selectedCategoryId === "all" && !searchInput.trim();
  const showSections = showBannerSection && sections.length > 0;
  const recommendedProducts = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.product_id));

    return dedupeProducts([...sections.flatMap((section) => section.products), ...products])
      .filter((product) => product.is_in_stock && !cartIds.has(product.id))
      .slice(0, 10);
  }, [cart, products, sections]);
  const buildWhatsAppOrderMessage = useCallback(
    (pdfUrl?: string | null) => {
      return buildWhatsAppMessage({
        tenantName: tenant.company_name,
        customerReferenceName,
        pdfUrl,
      });
    },
    [customerReferenceName, tenant.company_name],
  );

  const handleWhatsAppOrder = useCallback(async () => {
    if (!cart.length || !selectedPaymentMethod) {
      return;
    }

    setIsGeneratingOrderPdf(true);
    let pdfUrl: string | null = null;

    try {
      const response = await fetch("/api/storefront/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: analyticsSubdomain,
          items: cart,
          note,
          customer_reference_name: customerReferenceName.trim(),
          paymentMethod: selectedPaymentMethod,
          selectedInstallmentCount,
          cashDiscountTiers: storefrontSettings.cash_discount_tiers ?? [],
          isCashDiscountActive: storefrontSettings.is_cash_discount_active,
          cardCampaignTiers: storefrontSettings.card_campaign_tiers ?? [],
          isCardCampaignActive: storefrontSettings.is_card_campaign_active,
          cardInstallmentOptions: storefrontSettings.card_installment_options ?? [],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { pdfUrl?: string };
        pdfUrl = data.pdfUrl ?? null;
      } else {
        console.error("[whatsapp-order] PDF API hatası:", await response.text());
      }
    } catch (error) {
      console.error("[whatsapp-order] PDF üretimi başarısız:", error);
    } finally {
      setIsGeneratingOrderPdf(false);
    }

    const message = buildWhatsAppOrderMessage(pdfUrl);
    window.open(
      `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [
    analyticsSubdomain,
    buildWhatsAppOrderMessage,
    cart,
    customerReferenceName,
    note,
    selectedInstallmentCount,
    selectedPaymentMethod,
    storefrontSettings.card_campaign_tiers,
    storefrontSettings.card_installment_options,
    storefrontSettings.cash_discount_tiers,
    storefrontSettings.is_card_campaign_active,
    storefrontSettings.is_cash_discount_active,
    tenant.whatsapp_number,
  ]);
  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );
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
      ? selectedProduct.price * selectedTotalQuantity
      : 0;
  const filteredSelectedVariants = useMemo(() => {
    if (!selectedProduct?.has_variants) {
      return [];
    }

    return selectedProduct.variants.filter((variant) =>
      matchesVariantSearch(variant.model_name, variantSearchTerm),
    );
  }, [selectedProduct, variantSearchTerm]);
  const storefrontTitle = storefrontSettings.storefront_title || tenant.company_name;
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
    if (bannerItems.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveBannerIndex((currentIndex) => (currentIndex + 1) % bannerItems.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [bannerItems.length]);

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

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setHoveredCategoryId(null);
    setVisibleCount(24);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setVisibleCount(24);
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
    setActivePreviewTab("details");
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
      setPreviewDescriptionError("Detay bilgisi yüklenemedi.");
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
          let errorMessage = "Detay bilgisi yüklenemedi.";

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
          setPreviewDescriptionError("Detay bilgisi yüklenemedi.");
          setPreviewDescriptionLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [previewProduct, subdomain]);

  function openCartDrawer() {
    setIsCartOpen(true);
  }

  function closeAddToCartModal() {
    setSelectedProduct(null);
    setSelectedQuantity("0");
    setSelectedPackageCount("0");
    setSelectedCartonCount("0");
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
      error: result.error ?? "Seçilen modeller için stok doğrulaması başarısız oldu.",
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
        setQuantityError("Sepete eklemek için en az bir model seçin.");
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
        setQuantityError("Bazı model seçimleri şu anda satışa kapalı.");
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
      })();
      return;
    }

    if (
      selectedQuantityValue === null ||
      selectedPackageCountValue === null ||
      selectedCartonCountValue === null
    ) {
      setQuantityError("Lütfen geçerli tam sayı değerleri girin.");
      return;
    }

    if (selectedTotalQuantity <= 0) {
      setQuantityError("Sepete eklemek için en az bir değer girin.");
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
            "relative overflow-hidden rounded-[1.55rem] border p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)]",
            s.isQualified
              ? "border-blue-200 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_42%),linear-gradient(135deg,#eff6ff_0%,#ffffff_50%,#f0f9ff_100%)]"
              : "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
          )}
        >
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-2 top-2 z-10 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Kapat"
            >
              <X className="size-4" />
            </button>
          )}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl",
                compact ? "size-10" : "size-12",
                s.isQualified ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700",
              )}
            >
              <CreditCard className={compact ? "size-4" : "size-5"} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-semibold uppercase tracking-[0.2em]",
                  compact ? "text-[10px]" : "text-[11px]",
                  s.isQualified ? "text-blue-700" : "text-amber-700",
                )}
              >
                Kart Kampanyası
              </p>
              <p
                className={cn(
                  "mt-1 font-bold tracking-tight text-slate-950",
                  compact ? "text-sm leading-5" : "text-base leading-6",
                )}
              >
                {s.isQualified
                  ? s.nextTier
                    ? `${s.appliedTier!.maxFreeInstallmentCount} taksite kadar 0 Komisyon aktif 🎉 — ${formatCurrency(s.remainingAmount, s.currency)} daha ekle, ${s.nextTier.maxFreeInstallmentCount} taksite çık!`
                    : `Tebrikler! ${s.appliedTier!.maxFreeInstallmentCount} taksite kadar 0 Komisyon! 🎉`
                  : s.nextTier
                    ? `${formatCurrency(s.remainingAmount, s.currency)} daha ekle, ${s.nextTier.maxFreeInstallmentCount} taksite kadar 0 Komisyon kazan! 💳`
                    : "0 Komisyon kampanyası aktif 💳"}
              </p>
              <p
                className={cn(
                  "mt-1 text-slate-600",
                  compact ? "text-[11px] leading-4" : "text-sm leading-5",
                )}
              >
                {s.isQualified
                  ? `Sepetin ${formatCurrency(s.subtotal, s.currency)} — ${s.appliedTier!.maxFreeInstallmentCount} taksit ve altına vade farkı uygulanmaz.`
                  : s.nextTier
                    ? `İlk baraj ${formatCurrency(s.nextTier.threshold, s.currency)} · Sepetin şu an ${formatCurrency(s.subtotal, s.currency)}`
                    : `Sepetin ${formatCurrency(s.subtotal, s.currency)}`}
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
          "relative overflow-hidden rounded-[1.55rem] border p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)]",
          cartDiscountSummary.isQualified
            ? "border-emerald-200 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_42%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_50%,#f0fdf4_100%)]"
            : "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
        )}
      >
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-2 top-2 z-10 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
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
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700",
            )}
          >
            <Sparkles className={compact ? "size-4.5" : "size-5"} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-semibold uppercase tracking-[0.2em]",
                compact ? "text-[10px]" : "text-[11px]",
                cartDiscountSummary.isQualified ? "text-emerald-700" : "text-amber-700",
              )}
            >
              {cartDiscountSummary.isQualified ? "Nakit Kampanyası" : "Nakit Kampanyası"}
            </p>
            <p
              className={cn(
                "mt-1 font-bold tracking-tight text-slate-950",
                compact ? "text-sm leading-5" : "text-base leading-6",
              )}
            >
              {cartDiscountSummary.isQualified
                ? cartDiscountSummary.nextTier
                  ? `%${percentageLabel} aktif 🎉 — ${formatCurrency(cartDiscountSummary.remainingAmount, cartDiscountSummary.currency)} daha ekle, %${formatDiscountPercentage(cartDiscountSummary.nextTier.percentage)} kazan!`
                  : `Tebrikler! %${percentageLabel} İskonto Kazandınız! 🎉`
                : cartDiscountSummary.nextTier
                  ? `${formatCurrency(cartDiscountSummary.remainingAmount, cartDiscountSummary.currency)} daha mal ekle, %${formatDiscountPercentage(cartDiscountSummary.nextTier.percentage)} İskonto Kazan! 🚀`
                  : `%${percentageLabel} İskonto Kampanyası 🚀`}
            </p>
            <p
              className={cn(
                "mt-1 text-slate-600",
                compact ? "text-[11px] leading-4" : "text-sm leading-5",
              )}
            >
              {cartDiscountSummary.isQualified
                ? `Ara toplam ${formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency)} oldu. Net toplamın artık ${formatCurrency(cartDiscountSummary.totalAfterDiscount, cartDiscountSummary.currency)}.`
                : cartDiscountSummary.nextTier
                  ? `İlk baraj ${formatCurrency(cartDiscountSummary.nextTier.threshold, cartDiscountSummary.currency)} · Sepetin şu an ${formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency)}.`
                  : `Sepetin şu an ${formatCurrency(cartDiscountSummary.subtotal, cartDiscountSummary.currency)}.`}
            </p>
            {storefrontSettings.cash_discount_note?.trim() && !compact ? (
              <p
                className={cn(
                  "mt-2 rounded-xl border px-3 py-2 text-xs font-medium leading-5",
                  cartDiscountSummary.isQualified
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                ⚠️ Şart: {storefrontSettings.cash_discount_note}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderCrossSellCard(product: StorefrontProduct) {
    const cartQuantity = product.has_variants
      ? cartVariantCountByProductId.get(product.id) ?? 0
      : cartQuantityByProductId.get(product.id) ?? 0;

    return (
      <article
        key={product.id}
        className="relative overflow-visible min-w-[182px] max-w-[182px] rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
      >
        <div className="absolute left-3 right-14 top-3 z-10 flex">
          <span className="truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm">
            {categoryNameMap.get(product.category_id) || "Genel"}
          </span>
        </div>
        <StorefrontFloatingCartAction
          product={product}
          cartQuantity={cartQuantity}
          compact
          onIncrease={handleIncreaseCartItem}
          onDecrease={handleDecreaseCartItem}
          onOpenAddToCart={handleOpenAddToCartModal}
        />

        <div className="relative h-28 overflow-hidden rounded-[1.15rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
          <DiscountSticker product={product} />
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.product_name}
              fill
              className="object-contain p-4"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Store className="size-7 text-slate-300" />
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
            {product.product_name}
          </p>
          <p className="text-[11px] text-slate-500">
            {product.sku_code ? `SKU: ${product.sku_code}` : "SKU bilgisi yok"}
          </p>
          {getUnitSummary(product) ? (
            <p className="line-clamp-2 text-[11px] leading-4 text-slate-500">
              {getUnitSummary(product)}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <ProductPrice product={product} size="crossSell" />
          {cartQuantity > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              {cartQuantity} adet
            </span>
          ) : null}
        </div>
      </article>
    );
  }

  function renderProductPreviewModal() {
    if (!previewProduct) {
      return null;
    }

    const tabItems: Array<{ key: ProductDetailTab; label: string }> = [
      { key: "details", label: "Detaylar" },
      { key: "package", label: "Paket" },
      { key: "carton", label: "Koli" },
    ];

    const detailContent = previewDescription;
    const packageContent = previewProduct.package_quantity
      ? `1 Paket = ${previewProduct.package_quantity} adet`
      : "Paket bilgisi eklenmedi.";
    const cartonContent = previewProduct.carton_quantity
      ? `1 Koli = ${previewProduct.carton_quantity} adet`
      : "Koli bilgisi eklenmedi.";

    const tabContent =
      activePreviewTab === "details" ? (
        previewDescriptionLoading ? (
          <p className="text-sm leading-6 text-slate-400">Detay yükleniyor…</p>
        ) : previewDescriptionError ? (
          <p className="text-sm leading-6 text-amber-700">{previewDescriptionError}</p>
        ) : (
          <ProductDescriptionContent content={detailContent ?? null} />
        )
      ) : activePreviewTab === "package" ? (
        <p className="text-sm leading-6 text-slate-600">{packageContent}</p>
      ) : (
        <p className="text-sm leading-6 text-slate-600">{cartonContent}</p>
      );

    return (
      <Modal
        open={Boolean(previewProduct)}
        onClose={closeProductDetail}
        title="Ürün Detayı"
      >
        <div className="grid gap-4">
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
            <DiscountSticker product={previewProduct} />
            {previewProduct.image_url ? (
              <Image
                src={previewProduct.image_url}
                alt={previewProduct.product_name}
                fill
                className="object-contain p-6"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Store className="size-12 text-slate-300" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <ProductPrice product={previewProduct} size="modal" />
            <h3 className="text-lg font-semibold leading-6 text-slate-900">
              {previewProduct.product_name}
            </h3>
          </div>

          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivePreviewTab(tab.key)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activePreviewTab === tab.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[160px] max-h-[40vh] overflow-y-auto rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
            {tabContent}
          </div>

          <Button
            type="button"
            onClick={() => openAddToCartFromDetail(previewProduct)}
            disabled={!previewProduct.is_in_stock}
            className={cn(
              "h-12 w-full rounded-full text-base font-bold",
              !previewProduct.is_in_stock && "cursor-not-allowed opacity-50",
            )}
          >
            {previewProduct.is_in_stock ? "Sepete Ekle" : "Satışa Kapalı"}
          </Button>
        </div>
      </Modal>
    );
  }


  return (
    <div className="contents">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container-shell py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)_auto] lg:items-center">
            <div className="col-span-2 flex min-w-0 items-center gap-3 sm:gap-4 lg:col-span-1">
              <a
                href={homeHref ?? "#"}
                onClick={
                  homeHref
                    ? undefined
                    : (event) => {
                        event.preventDefault();
                        handleCategoryChange("all");
                      }
                }
                className="flex min-w-0 items-center gap-3 sm:gap-4"
              >
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm sm:h-16 sm:w-16 lg:h-20 lg:w-20 lg:rounded-[1.75rem]">
                  {storefrontSettings.logo_url ? (
                    <Image
                      src={storefrontSettings.logo_url}
                      alt={`${storefrontTitle} logo`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <Store className="size-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-xl lg:text-[1.65rem]">
                    {storefrontTitle}
                  </p>
                </div>
              </a>
            </div>

            <div
              className={cn(
                theme.searchWrap,
                "h-10 min-w-0 max-w-none rounded-full border-slate-200/80 bg-slate-50 shadow-none lg:h-11 lg:justify-self-center lg:w-full lg:max-w-md",
              )}
            >
              <Search className={cn(theme.searchIcon, "left-4 size-4 text-slate-400")} />
              <input
                placeholder="Ürün adı, SKU veya kategoriye göre arayın..."
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                className={cn(
                  theme.searchInput,
                  "h-10 rounded-full border-0 bg-transparent py-2 pl-10 pr-4 text-[16px] placeholder:text-slate-400 focus-visible:ring-0 focus:ring-0 lg:h-11",
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 lg:gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Sepet Toplamı
                </p>
                <div className="mt-1">
                  {cartTotalEntries.length ? (
                    cartTotalEntries.map(({ currency, total }) => (
                      <p key={currency} className="text-sm font-bold text-slate-900">
                        {currency}: {formatCurrency(total, currency)}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(cartTotal, cartCurrency)}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={openCartDrawer}
                className="relative flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:size-12"
                aria-label="Sepeti aç"
              >
                <ShoppingCart className="size-5" />
                {cart.length ? (
                  <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="container-shell">
            <nav
              className="relative hidden md:flex md:flex-wrap md:items-center md:justify-center md:gap-2 md:py-3"
              aria-label="Ana kategoriler"
            >
              {homeHref ? (
                <a
                  href={homeHref}
                  className="rounded-full px-4 py-2.5 text-[13px] font-semibold transition text-slate-700 hover:bg-slate-100"
                >
                  Tüm Ürünler
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-[13px] font-semibold transition",
                    selectedCategoryId === "all"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  Tüm Ürünler
                </button>
              )}

              {topCategories.map((category) => {
                const isActive =
                  selectedCategoryId === category.id ||
                  getDescendantCategoryIds(categories, category.id).includes(selectedCategoryId);
                const isOpen = hoveredCategoryId === category.id;

                return (
                  <div
                    key={category.id}
                    className="relative shrink-0"
                    onMouseEnter={() => setHoveredCategoryId(category.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition duration-200",
                        isActive
                          ? "scale-[1.03] bg-slate-900 text-white font-bold shadow-sm"
                          : "text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <span>{category.name}</span>
                      {category.children.length ? <ChevronDown className="size-4" /> : null}
                    </button>

                    {category.children.length && isOpen ? (
                      <div className="absolute left-0 top-full z-30 pt-1">
                        <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                          <div className="space-y-0.5">
                            {category.children.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => handleCategoryChange(child.id)}
                                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                {child.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 py-3 md:hidden">
              <div className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 whitespace-nowrap">
                {homeHref ? (
                  <a
                    href={homeHref}
                    className="shrink-0 border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-slate-700"
                  >
                    Tüm Ürünler
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("all")}
                    className={cn(
                      "shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition",
                      selectedCategoryId === "all"
                        ? "border-emerald-600 text-slate-950"
                        : "border-transparent text-slate-500",
                    )}
                  >
                    Tüm Ürünler
                  </button>
                )}

                {topCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={cn(
                      "shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition duration-200",
                      selectedTopCategoryId === category.id
                        ? "scale-[1.03] border-emerald-600 text-slate-950 font-bold"
                        : "border-transparent text-slate-500",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {selectedTopCategory && mobileSubcategories.length ? (
                <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
                  {mobileSubcategories.map((subcategory) => {
                    const isActive = selectedCategoryId === subcategory.id;

                    return (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => handleCategoryChange(subcategory.id)}
                        className={cn(
                          "shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200",
                          isActive
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700",
                        )}
                      >
                        {subcategory.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="container-shell sticky-safe-bottom py-5 sm:py-6">
        {showBannerSection ? (
          <section className="mb-5 sm:mb-10 w-full">
            {bannerItems.length ? (
              <div className="w-full space-y-4">
                {currentBanner
                  ? renderBannerItem(
                      currentBanner,
                      activeBannerIndex,
                      storefrontTitle,
                    )
                  : null}
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
                            ? "w-8 bg-slate-900"
                            : "w-2.5 bg-slate-300 hover:bg-slate-400",
                        )}
                        aria-label={`Banner ${index + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-[240px] w-full flex-col justify-center rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center md:min-h-[320px] lg:min-h-[400px]">
                <p className="text-sm font-semibold text-slate-900">Banner alanı şu an boş</p>
                <p className="mt-2 text-sm text-slate-500">
                  Admin panelindeki vitrin ayarlarından kampanya banner’ları ekleyebilirsiniz.
                </p>
              </div>
            )}
          </section>
        ) : null}

        {hasVisibleHomeCampaignBars ? (
          <section className="mb-5 hidden space-y-3 sm:mb-6 xl:block">
            {renderCampaignBarsForSurface("home", false)}
          </section>
        ) : null}

        {showSections ? (
          <div className="mb-10 space-y-10">
            {sections.map((section) => {
              const visibleSectionProducts = section.products.slice(0, 8);
              const hasMore = section.products.length > 8;
              const sectionHref = subdomain
                ? `/store/${subdomain}/section/${section.id}`
                : null;

              return (
                <section key={section.id}>
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                      {section.title}
                    </h2>
                    {hasMore && sectionHref ? (
                      <a
                        href={sectionHref}
                        className="shrink-0 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Devamı →
                      </a>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                    {visibleSectionProducts.map((product) => (
                      <StorefrontProductCard
                        key={product.id}
                        product={product}
                        cartQuantity={
                          product.has_variants
                            ? cartVariantCountByProductId.get(product.id) ?? 0
                            : cartQuantityByProductId.get(product.id) ?? 0
                        }
                        addedVariantCount={cartVariantCountByProductId.get(product.id) ?? 0}
                        productCardClassName={theme.productCard}
                        productImageWrapClassName={theme.productImageWrap}
                        onOpenDetail={handleOpenProductDetail}
                        onIncrease={handleIncreaseCartItem}
                        onDecrease={handleDecreaseCartItem}
                        onOpenAddToCart={handleOpenAddToCartModal}
                      />
                    ))}
                  </div>

                  {hasMore && sectionHref ? (
                    <div className="mt-6 flex justify-center">
                      <a
                        href={sectionHref}
                        className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow"
                      >
                        Tüm {section.title} Ürünlerini Gör ({section.products.length} ürün)
                      </a>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : null}

        <section id="catalog-grid" className="scroll-mt-28 pt-1">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                {selectedCategoryId !== "all"
                  ? (categoryNameMap.get(selectedCategoryId) ?? "Ürünler")
                  : (pageTitle ?? "Tüm Ürünler")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-sm">
                <span className="font-semibold text-slate-900">{filteredProducts.length}</span>{" "}
                ürün bulundu
              </div>
              <div className="rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{visibleProducts.length}</span>{" "}
                ürün gösteriliyor
              </div>
            </div>
          </div>

          {filteredProducts.length ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <StorefrontProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={
                    product.has_variants
                      ? cartVariantCountByProductId.get(product.id) ?? 0
                      : cartQuantityByProductId.get(product.id) ?? 0
                  }
                  addedVariantCount={cartVariantCountByProductId.get(product.id) ?? 0}
                  productCardClassName={theme.productCard}
                  productImageWrapClassName={theme.productImageWrap}
                  onOpenDetail={handleOpenProductDetail}
                  onIncrease={handleIncreaseCartItem}
                  onDecrease={handleDecreaseCartItem}
                  onOpenAddToCart={handleOpenAddToCartModal}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-[2rem] border-dashed bg-transparent p-10 text-center">
              <p className="text-base font-semibold">Uyuşan ürün bulunamadı.</p>
              <p className="mt-1 text-sm text-slate-500">
                Arama kriterlerini veya seçili kategoriyi değiştirmeyi deneyin.
              </p>
            </Card>
          )}

          {filteredProducts.length > visibleCount ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow"
              >
                Daha Fazla Ürün Göster ({filteredProducts.length - visibleCount} ürün kaldı)
              </button>
            </div>
          ) : null}
        </section>
      </main>

      {hasVisibleHomeCampaignBars ? (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="fixed left-4 right-4 z-40 space-y-2 xl:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 6.5rem)" }}
        >
          {renderCampaignBarsForSurface("home", true)}
        </motion.div>
      ) : null}

      {isMounted && cart.length ? (
        <motion.button
          type="button"
          onClick={openCartDrawer}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className={cn(
            theme.stickyCart,
            "safe-bottom-offset left-4 right-4 rounded-[1.8rem] border border-emerald-400/10 px-4 py-3 text-left shadow-[0_18px_44px_rgba(15,23,42,0.22)] xl:hidden",
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <ShoppingCart className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold tracking-tight text-white">
                Sipariş Özeti
              </p>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {cartDistinctCount} kalem, {cartItemCount} ürün
              </p>
            </div>
            <div className="min-w-0 text-right">
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
                      {formatCurrency(
                        cartDiscountSummary.subtotal,
                        cartDiscountSummary.currency,
                      )}
                    </p>
                    <p
                      className={cn(
                        "truncate text-[13px] font-semibold leading-tight",
                        theme.stickyCartText,
                      )}
                    >
                      {formatCurrency(
                        cartDiscountSummary.totalAfterDiscount,
                        cartDiscountSummary.currency,
                      )}
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
            </div>
            <span
              className={cn(
                theme.stickyCartButton,
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(16,185,129,0.22)]",
              )}
            >
              Devam &gt;
            </span>
          </div>
        </motion.button>
      ) : null}

      <StorefrontCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        cartDistinctCount={cartDistinctCount}
        cartItemCount={cartItemCount}
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
        recommendedProducts={recommendedProducts}
        cartPaymentSummary={cartPaymentSummary}
        cartDiscountSummary={cartDiscountSummary}
        cartTotalEntries={cartTotalEntries}
        cartTotal={cartTotal}
        cartCurrency={cartCurrency}
        onWhatsAppOrder={handleWhatsAppOrder}
        isGeneratingOrderPdf={isGeneratingOrderPdf}
        cartStorageKey={cartStorageKey}
        stickyCartButtonClassName={theme.stickyCartButton}
        isCashCampaignDismissedOnCart={isCampaignDismissedOnSurface("cash", "cart")}
        isCardCampaignDismissedOnCart={isCampaignDismissedOnSurface("card", "cart")}
        onDismissCashCampaignOnCart={() => dismissCampaignOnSurface("cash", "cart")}
        onDismissCardCampaignOnCart={() => dismissCampaignOnSurface("card", "cart")}
        renderCashDiscountBar={renderCashDiscountBar}
        renderCardCampaignBar={renderCardCampaignBar}
        renderCrossSellCard={renderCrossSellCard}
      />
      {renderProductPreviewModal()}

      {isAnnouncementEligible && activeAnnouncement ? (
        <AnnouncementModal
          key={announcementRenderKey ?? activeAnnouncement.version}
          announcement={activeAnnouncement}
          onDismiss={closeAnnouncementModal}
        />
      ) : null}

      <Modal
        open={Boolean(selectedProduct)}
        onClose={closeAddToCartModal}
        title={selectedProduct?.has_variants ? "Model Seçimi" : "Sepete Ekle"}
        contentScroll={!selectedProduct?.has_variants}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="submit"
              form="add-to-cart-form"
              className="flex h-11 w-full rounded-full text-sm font-bold sm:h-auto sm:w-auto sm:rounded-lg sm:px-4 sm:py-2.5"
            >
              Sepete Ekle
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={closeAddToCartModal}
              className="flex h-10 w-full rounded-full text-sm sm:h-auto sm:w-auto sm:rounded-lg sm:px-4 sm:py-2.5"
            >
              Vazgeç
            </Button>
          </div>
        }
      >
        {selectedProduct ? (
          <form
            id="add-to-cart-form"
            onSubmit={confirmAddToCart}
            className={cn(
              "w-full min-w-0 max-w-full gap-4",
              selectedProduct.has_variants
                ? "flex min-h-0 flex-1 flex-col"
                : "grid",
            )}
          >
            <div className="w-full min-w-0 max-w-full shrink-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div className="flex w-full min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 break-words text-pretty text-[13px] font-semibold leading-5 text-slate-900">
                    {selectedProduct.product_name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {selectedProduct.sku_code || "SKU bilgisi yok"}
                  </p>
                  {!selectedProduct.has_variants && getUnitSummary(selectedProduct) ? (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {getUnitSummary(selectedProduct)}
                    </p>
                  ) : null}
                </div>
                <ProductPrice product={selectedProduct} size="compact" />
              </div>
            </div>

            {selectedProduct.has_variants ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2.5">
                <div className="relative shrink-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={variantSearchTerm}
                    onChange={(event) => setVariantSearchTerm(event.target.value)}
                    placeholder="Model ara (14 Pro, 12/12 PF)"
                    className="h-9 rounded-lg pl-9 pr-3 text-[16px]"
                  />
                </div>

                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
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
                            "rounded-lg border px-2.5 py-2 transition",
                            isUnavailable
                              ? "border-slate-200 bg-slate-50 opacity-40"
                              : "border-slate-200 bg-white",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate pr-2 text-[13px] font-semibold leading-5 text-slate-900">
                              {variant.model_name}
                            </p>
                            {isUnavailable ? (
                              <Badge className="px-2 py-1 text-[10px] bg-slate-200 text-slate-600">
                                Tükendi
                              </Badge>
                            ) : null}
                          </div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem]">
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
                              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[16px] text-slate-900 disabled:bg-slate-100"
                              style={{ fontSize: "16px" }}
                            >
                              {unitChoices.map((unitOption) => (
                                <option key={unitOption.value} value={unitOption.value}>
                                  {unitOption.label}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              disabled={isUnavailable}
                              value={selection.quantity ? String(selection.quantity) : "0"}
                              onChange={(event) => {
                                const nextQuantity = parseUnitCount(event.target.value);
                                updateVariantSelection(variant.id, {
                                  variantId: variant.id,
                                  quantity: nextQuantity && nextQuantity > 0 ? nextQuantity : 0,
                                });
                                if (quantityError) {
                                  setQuantityError(null);
                                }
                              }}
                              placeholder="0"
                              className="h-9 px-2.5 py-2 text-[16px]"
                              style={{ fontSize: "16px" }}
                            />
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                            {variant.package_quantity ? (
                              <span>1 Paket = {variant.package_quantity}</span>
                            ) : null}
                            {variant.carton_quantity ? (
                              <span>1 Koli = {variant.carton_quantity}</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                      {variantSearchTerm.trim()
                        ? `“${variantSearchTerm.trim()}” için model bulunamadı.`
                        : "Gösterilecek model bulunamadı."}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid w-full min-w-0 max-w-full gap-3 sm:grid-cols-3">
                <div className="min-w-0 space-y-2">
                  <label className="text-sm font-semibold text-slate-900">ADET</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={selectedQuantity}
                    onChange={(event) => {
                      setSelectedQuantity(event.target.value);
                      if (quantityError) {
                        setQuantityError(null);
                      }
                    }}
                    placeholder="0"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                {selectedProduct.package_quantity ? (
                  <div className="min-w-0 space-y-2">
                    <label className="text-sm font-semibold text-slate-900">
                      PAKET
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={selectedPackageCount}
                      onChange={(event) => {
                        setSelectedPackageCount(event.target.value);
                        if (quantityError) {
                          setQuantityError(null);
                        }
                      }}
                      placeholder="0"
                      style={{ fontSize: "16px" }}
                    />
                    <p className="text-xs text-slate-500">
                      1 Paket = {selectedProduct.package_quantity} adet
                    </p>
                  </div>
                ) : null}

                {selectedProduct.carton_quantity ? (
                  <div className="min-w-0 space-y-2">
                    <label className="text-sm font-semibold text-slate-900">KOLİ</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={selectedCartonCount}
                      onChange={(event) => {
                        setSelectedCartonCount(event.target.value);
                        if (quantityError) {
                          setQuantityError(null);
                        }
                      }}
                      placeholder="0"
                      style={{ fontSize: "16px" }}
                    />
                    <p className="text-xs text-slate-500">
                      1 Koli = {selectedProduct.carton_quantity} adet
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {quantityError ? (
              <p className="shrink-0 text-xs text-amber-700">{quantityError}</p>
            ) : null}

            <div className="w-full min-w-0 max-w-full shrink-0 rounded-xl bg-slate-900 p-3 text-white">
              {selectedProduct.has_variants ? (
                <>
                  <p className="text-xs text-slate-300">Seçilen Modeller</p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    {
                      variantSelections.filter((selection) => selection.quantity > 0).length
                    }{" "}
                    model
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatCurrency(
                      variantSelections.reduce((total, selection) => {
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
                            selectedProduct.price
                        );
                      }, 0),
                      selectedProduct.currency,
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-300">Toplam</p>
                  <p className="mt-0.5 text-xs text-slate-300">{selectedTotalQuantity} adet</p>
                  <p className="mt-1 break-words text-xl font-bold">
                    {formatCurrency(selectedLineTotal, selectedProduct.currency)}
                  </p>
                </>
              )}
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}