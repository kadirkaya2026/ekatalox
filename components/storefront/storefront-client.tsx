"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ChevronDown,
  Minus,
  OctagonAlert,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCategoryTree,
  getCategoryLineage,
  getDescendantCategoryIds,
} from "@/lib/categories/tree";
import { supportedCurrencyCodes } from "@/lib/products/constants";
import {
  buildWhatsAppMessage,
  getCartCurrency,
  getCartTotal,
  getCartTotalsByCurrency,
} from "@/lib/storefront/cart";
import { storefrontThemes } from "@/lib/storefront/themes";
import type {
  BannerItem,
  CartItem,
  Category,
  StorefrontProduct,
  StorefrontSectionWithProducts,
  Tenant,
  TenantStorefrontSettings,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function getCartStorageKey(tenantId: string) {
  return `ekatalox_cart_${tenantId}`;
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

    return parsedValue.filter(isValidCartItem);
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
    return [...items, { ...product, quantity }];
  }

  return items.map((item) =>
    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
  );
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

type PurchaseUnitOption = {
  key: "quantity" | "package" | "carton";
  label: string;
  quantity: number;
  description: string;
};

function getPurchaseUnitOptions(product: StorefrontProduct): PurchaseUnitOption[] {
  const options: PurchaseUnitOption[] = [
    {
      key: "quantity",
      label: "Adet",
      quantity: 1,
      description: "1 Adet",
    },
  ];

  if (product.package_quantity) {
    options.push({
      key: "package",
      label: "Paket",
      quantity: product.package_quantity,
      description: `1 Paket = ${product.package_quantity} Adet`,
    });
  }

  if (product.carton_quantity) {
    options.push({
      key: "carton",
      label: "Koli",
      quantity: product.carton_quantity,
      description: `1 Koli = ${product.carton_quantity} Adet`,
    });
  }

  return options;
}

function getCategoryMonogram(name: string) {
  const normalized = name.trim();

  if (!normalized) {
    return "KT";
  }

  return normalized.slice(0, 2).toLocaleUpperCase("tr-TR");
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

function updateQuantity(items: CartItem[], productId: string, nextQuantity: number) {
  if (nextQuantity <= 0) {
    return items.filter((item) => item.id !== productId);
  }

  return items.map((item) =>
    item.id === productId ? { ...item, quantity: nextQuantity } : item,
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

function buildCategoryProductCount(
  categories: Category[],
  products: StorefrontProduct[],
) {
  return new Map(
    categories.map((category) => [
      category.id,
      products.filter((product) =>
        getDescendantCategoryIds(categories, category.id).includes(product.category_id),
      ).length,
    ]),
  );
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
      <div className="relative aspect-[16/7] bg-slate-950 sm:aspect-[3/1] md:min-h-[340px] md:aspect-auto md:bg-transparent lg:min-h-[400px]">
        {banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.title ?? `${title} banner`}
            fill
            className="object-contain object-center p-2 sm:p-3 md:object-cover md:p-0"
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

const floatingActionTransition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
  mass: 0.9,
};

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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [note, setNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [openUnitPickerProductId, setOpenUnitPickerProductId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isMobileOrderNoteOpen, setIsMobileOrderNoteOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    subscribeToMountState,
    getClientMountedState,
    getServerMountedState,
  );

  const theme = storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;
  const cartStorageKey = useMemo(() => getCartStorageKey(tenant.id), [tenant.id]);
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const categoryCounts = useMemo(
    () => buildCategoryProductCount(categories, products),
    [categories, products],
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

    return [
      {
        id: selectedTopCategory.id,
        name: "Tümü",
        count: categoryCounts.get(selectedTopCategory.id) ?? 0,
        monogram: getCategoryMonogram(selectedTopCategory.name),
      },
      ...selectedTopCategory.children.map((child) => ({
        id: child.id,
        name: child.name,
        count: categoryCounts.get(child.id) ?? 0,
        monogram: getCategoryMonogram(child.name),
      })),
    ];
  }, [categoryCounts, selectedTopCategory]);

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);
  const cartCurrency = useMemo(() => getCartCurrency(cart), [cart]);
  const cartTotalsByCurrency = useMemo(() => getCartTotalsByCurrency(cart), [cart]);
  const cartQuantityByProductId = useMemo(
    () => new Map(cart.map((item) => [item.id, item.quantity])),
    [cart],
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

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("tr-TR");

    return products.filter((product) => {
      const matchesCategory =
        !selectedCategoryIds || selectedCategoryIds.has(product.category_id);
      const productName = product.product_name.toLocaleLowerCase("tr-TR");
      const skuCode = product.sku_code?.toLocaleLowerCase("tr-TR") ?? "";
      const lineage = getCategoryLineage(categories, product.category_id)
        .map((item) => item.name.toLocaleLowerCase("tr-TR"))
        .join(" ");
      const matchesSearch =
        !normalizedSearch ||
        productName.includes(normalizedSearch) ||
        skuCode.includes(normalizedSearch) ||
        lineage.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [categories, products, searchTerm, selectedCategoryIds]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const bannerItems = storefrontSettings.banner_items ?? [];
  const currentBanner = bannerItems[activeBannerIndex] ?? null;
  const recommendedProducts = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.id));

    return dedupeProducts([...sections.flatMap((section) => section.products), ...products])
      .filter((product) => product.is_in_stock && !cartIds.has(product.id))
      .slice(0, 10);
  }, [cart, products, sections]);
  const whatsappHref = useMemo(() => {
    if (!cart.length) {
      return "#";
    }

    const message = buildWhatsAppMessage({
      tenantName: tenant.company_name,
      items: cart,
      note,
    });

    return `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(message)}`;
  }, [cart, note, tenant.company_name, tenant.whatsapp_number]);
  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );
  const storefrontTitle = storefrontSettings.storefront_title || tenant.company_name;

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
    if (!openUnitPickerProductId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest('[data-unit-picker-root="true"]')) {
        return;
      }

      setOpenUnitPickerProductId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openUnitPickerProductId]);

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setHoveredCategoryId(null);
    setOpenUnitPickerProductId(null);
    setVisibleCount(24);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setOpenUnitPickerProductId(null);
    setVisibleCount(24);
  }

  function openCartDrawer() {
    setOpenUnitPickerProductId(null);
    setIsCartOpen(true);
  }

  function toggleUnitPicker(productId: string) {
    setOpenUnitPickerProductId((current) => (current === productId ? null : productId));
  }

  function addProductWithUnit(product: StorefrontProduct, quantity: number) {
    if (!product.is_in_stock || quantity <= 0) {
      return;
    }

    setCart((current) => addToCart(current, product, quantity));
    setOpenUnitPickerProductId(null);
  }

  function updateCartItemQuantity(productId: string, value: string) {
    if (value === "") {
      setCart((current) => updateQuantity(current, productId, 0));
      return;
    }

    const quantity = Number.parseInt(value, 10);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setCart((current) => updateQuantity(current, productId, 0));
      return;
    }

    setCart((current) => updateQuantity(current, productId, quantity));
  }

  function increaseCartItem(product: StorefrontProduct) {
    setCart((current) => {
      const currentQuantity = current.find((item) => item.id === product.id)?.quantity ?? 0;
      return updateQuantity(current, product.id, currentQuantity + 1);
    });
  }

  function decreaseCartItem(product: StorefrontProduct) {
    setCart((current) => {
      const currentQuantity = current.find((item) => item.id === product.id)?.quantity ?? 0;
      return updateQuantity(current, product.id, currentQuantity - 1);
    });
  }

  function clearCart() {
    setCart([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(cartStorageKey);
    }
    setIsMobileOrderNoteOpen(false);
  }

  function renderFloatingCartAction(product: StorefrontProduct, compact = false) {
    const cartQuantity = cartQuantityByProductId.get(product.id) ?? 0;
    const unitOptions = getPurchaseUnitOptions(product);

    if (!product.is_in_stock) {
      return null;
    }

    if (cartQuantity > 0) {
      return (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`stepper-${product.id}`}
            data-unit-picker-root="true"
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={floatingActionTransition}
            className={cn(
              "absolute right-3 top-3 z-20 flex origin-top-right flex-col items-center rounded-[1.35rem] border border-emerald-400/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.98)_0%,rgba(5,150,105,0.96)_100%)] p-1 text-white shadow-[0_18px_40px_rgba(5,150,105,0.34)] backdrop-blur",
              compact ? "w-10" : "w-11 sm:w-12",
            )}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => increaseCartItem(product)}
              className={cn(
                "flex items-center justify-center rounded-full text-white transition hover:bg-white/15",
                compact ? "size-8" : "size-9 sm:size-10",
              )}
              aria-label="Adedi artır"
            >
              <Plus className={compact ? "size-4" : "size-4 sm:size-5"} />
            </motion.button>
            <motion.span
              layout
              className={cn(
                "flex min-h-7 items-center justify-center text-center font-bold leading-none",
                compact ? "px-1 text-[11px]" : "px-1 text-sm",
              )}
            >
              {cartQuantity}
            </motion.span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => decreaseCartItem(product)}
              className={cn(
                "flex items-center justify-center rounded-full text-white transition hover:bg-white/15",
                compact ? "size-8" : "size-9 sm:size-10",
              )}
              aria-label={cartQuantity === 1 ? "Ürünü sepetten çıkar" : "Adedi azalt"}
            >
              {cartQuantity === 1 ? (
                <Trash2 className={compact ? "size-4" : "size-4 sm:size-5"} />
              ) : (
                <Minus className={compact ? "size-4" : "size-4 sm:size-5"} />
              )}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      );
    }

    if (openUnitPickerProductId === product.id) {
      return (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`picker-${product.id}`}
            data-unit-picker-root="true"
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -5 }}
            transition={floatingActionTransition}
            className={cn(
              "absolute right-3 top-3 z-20 w-44 origin-top-right overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/92 p-2 shadow-[0_20px_48px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/5 backdrop-blur-xl",
              compact && "w-40",
            )}
          >
            <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Birim Seç
            </p>
            <div className="space-y-1">
              {unitOptions.map((option, index) => (
                <motion.button
                  key={option.key}
                  type="button"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.16, ease: "easeOut" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addProductWithUnit(product, option.quantity)}
                  className="flex w-full flex-col rounded-2xl border border-transparent bg-slate-50/90 px-3 py-2.5 text-left transition hover:border-emerald-100 hover:bg-emerald-50"
                >
                  <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                  <span className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    {option.description}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    return (
      <motion.div
        layout
        data-unit-picker-root="true"
        className="absolute right-3 top-3 z-20 origin-top-right"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => toggleUnitPicker(product.id)}
          className={cn(
            "flex items-center justify-center rounded-full border border-emerald-500/90 bg-[linear-gradient(180deg,#10b981_0%,#059669_100%)] text-white shadow-[0_18px_34px_rgba(5,150,105,0.3)] transition-all duration-200 hover:bg-emerald-500",
            compact ? "size-10" : "size-11 sm:size-12",
          )}
          aria-label="Ürün ekleme birimini seç"
        >
          <Plus className={compact ? "size-4" : "size-5"} />
        </motion.button>
      </motion.div>
    );
  }

  function renderProductCard(product: StorefrontProduct) {
    const cartQuantity = cartQuantityByProductId.get(product.id) ?? 0;

    return (
      <article key={product.id} className={cn(theme.productCard, "rounded-[1.55rem]")}>
        <div className={cn(theme.productImageWrap, "p-4 sm:p-5")}>
          <div className="absolute left-3 right-14 top-3 z-10 flex flex-wrap items-center gap-2 sm:left-4 sm:right-16 sm:top-4">
            <span className="max-w-full truncate rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 backdrop-blur">
              {categoryNameMap.get(product.category_id) || "Genel"}
            </span>
          </div>
          {renderFloatingCartAction(product)}
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.product_name}
              fill
              className="object-contain p-6 transition duration-500 group-hover:scale-[1.06]"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[1.4rem] border border-dashed border-slate-200/80 bg-white/70">
              <Store className="size-9 text-slate-300" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_in_stock ? (
                <span className={theme.stockBadgeIn}>Stokta</span>
              ) : (
                <span className={theme.stockBadgeOut}>
                  <OctagonAlert className="mr-1 size-3.5" />
                  Tükendi
                </span>
              )}
              {product.carton_quantity ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  Koli {product.carton_quantity}
                </span>
              ) : null}
            </div>
            <p className={cn(theme.productTitle, "text-[13px] leading-5 sm:text-[14px]")}>
              {product.product_name}
            </p>
            <p className={theme.productMeta}>
              {product.sku_code ? `SKU: ${product.sku_code}` : "SKU bilgisi tanımlanmadı"}
            </p>
            {getUnitSummary(product) ? (
              <p className="line-clamp-2 text-[11px] leading-5 text-slate-500">
                {getUnitSummary(product)}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100/80 pt-3.5">
            <p className={cn(theme.productPrice, "text-[15px] sm:text-lg")}>
              {formatCurrency(product.price, product.currency)}
            </p>
            {cartQuantity > 0 ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {cartQuantity} adet
              </span>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderCrossSellCard(product: StorefrontProduct) {
    const cartQuantity = cartQuantityByProductId.get(product.id) ?? 0;

    return (
      <article
        key={product.id}
        className="relative min-w-[182px] max-w-[182px] rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
      >
        <div className="absolute left-3 right-14 top-3 z-10 flex">
          <span className="truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm">
            {categoryNameMap.get(product.category_id) || "Genel"}
          </span>
        </div>
        {renderFloatingCartAction(product, true)}

        <div className="relative h-28 overflow-hidden rounded-[1.15rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
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
          <p className="text-sm font-bold text-slate-950">
            {formatCurrency(product.price, product.currency)}
          </p>
          {cartQuantity > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              {cartQuantity} adet
            </span>
          ) : null}
        </div>
      </article>
    );
  }

  function renderCartDrawer() {
    if (!isCartOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md">
        <button
          type="button"
          aria-label="Sepeti kapat"
          className="absolute inset-0 h-full w-full"
          onClick={() => setIsCartOpen(false)}
        />
        <div className="absolute inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.22)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[460px] lg:rounded-l-[2rem] lg:rounded-tr-none">
          <div className="flex h-full max-h-[94dvh] flex-col lg:max-h-none">
            <div className="flex justify-center pt-3 lg:hidden">
              <span className="h-1.5 w-14 rounded-full bg-slate-200" />
            </div>

            <div className="border-b border-slate-100 px-4 pb-3 pt-3 sm:px-5 lg:px-6 lg:pb-4 lg:pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Sipariş Özeti
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                    Sepetim
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {cartDistinctCount} kalem, {cartItemCount} ürün
                    </span>
                    <span className="hidden rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline-flex">
                      Hızlı sipariş özeti
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
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
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-contain p-3"
                              unoptimized
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
                              <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
                                {item.product_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.sku_code ? `SKU: ${item.sku_code}` : "SKU bilgisi yok"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCart((current) => updateQuantity(current, item.id, 0))
                              }
                              className="h-fit rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Ürünü sepetten çıkar"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                              Birim fiyat: {formatCurrency(item.price, item.currency)}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                              {item.is_in_stock ? "Stokta" : "Tükendi"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
                        <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 sm:p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity - 1),
                              )
                            }
                            className="flex size-8 sm:size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                            aria-label="Adedi azalt"
                          >
                            <Minus className="size-4" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(event) =>
                              updateCartItemQuantity(item.id, event.target.value)
                            }
                            className="h-8 sm:h-9 w-10 sm:w-14 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                            aria-label="Ürün adedi"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity + 1),
                              )
                            }
                            className="flex size-8 sm:size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                            aria-label="Adedi artır"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Ara Toplam
                          </p>
                          <p className="mt-1 text-base font-bold tracking-tight text-slate-950">
                            {formatCurrency(item.price * item.quantity, item.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

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

            <div className="shrink-0 border-t border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-2.5 sm:p-3 lg:p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:rounded-[1.75rem]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Sipariş Notu
                    </p>
                    <p className="mt-1 hidden text-sm text-slate-500 md:block">
                      İsterseniz teslimat veya sipariş detayını ekleyin.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    Opsiyonel
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileOrderNoteOpen((current) => !current)}
                  className="mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 sm:py-3 text-left md:hidden"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    Sipariş notu ekle
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-slate-500 transition-transform",
                      isMobileOrderNoteOpen && "rotate-180",
                    )}
                  />
                </button>

                <Textarea
                  placeholder="Sipariş notu (opsiyonel)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={cn(
                    "mt-2 sm:mt-4 rounded-[1.25rem] border-slate-200 bg-slate-50/70 text-sm",
                    isMobileOrderNoteOpen ? "block min-h-[3.25rem] sm:min-h-20" : "hidden md:block md:min-h-24",
                  )}
                />

                <div className="mt-3 rounded-[1.45rem] bg-slate-950 p-3.5 text-white shadow-[0_18px_48px_rgba(15,23,42,0.24)] sm:mt-4 sm:rounded-[1.5rem] sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                        Toplamlar
                      </p>
                      <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                        {cartDistinctCount} kalem, {cartItemCount} ürün için sipariş özeti
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                      Hazır
                    </span>
                  </div>

                  <div className="mt-3 sm:mt-4 space-y-2">
                    {cartTotalEntries.length ? (
                      cartTotalEntries.map(({ currency, total }) => (
                        <div
                          key={currency}
                          className="flex items-center justify-between gap-2 sm:gap-3 rounded-full bg-white/5 px-3 sm:px-4 py-2 sm:py-3"
                        >
                          <p className="text-sm font-semibold text-slate-300">{currency}</p>
                          <p className="text-lg font-bold tracking-tight text-white">
                            {formatCurrency(total, currency)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between gap-2 sm:gap-3 rounded-full bg-white/5 px-3 sm:px-4 py-2 sm:py-3">
                        <p className="text-sm font-semibold text-slate-300">{cartCurrency}</p>
                        <p className="text-lg font-bold tracking-tight text-white">
                          {formatCurrency(cartTotal, cartCurrency)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  asChild
                  href={whatsappHref}
                  className={cn(
                    "mt-3 h-11 w-full rounded-full px-5 text-base font-bold shadow-none sm:mt-4 sm:h-12",
                    theme.stickyCartButton,
                    !cart.length && "pointer-events-none opacity-50",
                  )}
                >
                  <span>WhatsApp ile Siparişi Tamamla</span>
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
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className={cn(
                  theme.searchInput,
                  "h-10 rounded-full border-0 bg-transparent py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus:ring-0 lg:h-11",
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
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition",
                        isActive
                          ? "bg-slate-900 text-white"
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
                      "shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition",
                      selectedTopCategoryId === category.id
                        ? "border-emerald-600 text-slate-950"
                        : "border-transparent text-slate-500",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {selectedTopCategory ? (
                <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
                  {mobileSubcategories.map((subcategory) => {
                    const isActive =
                      selectedCategoryId === subcategory.id ||
                      (subcategory.id === selectedTopCategory.id &&
                        !selectedTopCategory.children.some(
                          (child) => child.id === selectedCategoryId,
                        ));

                    return (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => handleCategoryChange(subcategory.id)}
                        className={cn(
                          "flex shrink-0 flex-col items-center gap-2 rounded-[1.35rem] border px-4 py-3 text-center transition duration-200",
                          isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-11 items-center justify-center rounded-2xl text-xs font-bold",
                            isActive
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {subcategory.monogram}
                        </span>
                        <span className="max-w-20 text-xs font-semibold leading-4">
                          {subcategory.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {subcategory.count} ürün
                        </span>
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
        <section className="mb-10 w-full">
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

        {sections.length > 0 && selectedCategoryId === "all" && !searchTerm ? (
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

                  <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                    {visibleSectionProducts.map((product) => renderProductCard(product))}
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
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => renderProductCard(product))}
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

      {isMounted && cart.length ? (
        <motion.button
          type="button"
          onClick={openCartDrawer}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className={cn(
            theme.stickyCart,
            "safe-bottom-offset left-4 right-4 rounded-[1.8rem] border border-emerald-400/10 px-4 py-3.5 text-left shadow-[0_18px_44px_rgba(15,23,42,0.22)] xl:hidden",
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
                {cartTotalEntries.length ? (
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

      {renderCartDrawer()}
    </div>
  );
}