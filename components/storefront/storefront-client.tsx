"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ChevronDown,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
  getCartVariantCount,
} from "@/lib/storefront/cart";
import { storefrontThemes } from "@/lib/storefront/themes";
import {
  canSelectVariantUnit,
  getMaxUnitCount,
  getRequestedUnitQuantity,
  type SalesUnit,
} from "@/lib/storefront/variants";
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
        description: product.description ?? null,
        image_url: product.image_url,
        is_in_stock: product.is_in_stock,
        currency: product.currency,
        price: product.price,
        package_quantity: product.package_quantity,
        carton_quantity: product.carton_quantity,
        stock_quantity: product.stock_quantity,
        quantity,
      },
    ];
  }

  return items.map((item) =>
    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
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
          description: product.description ?? null,
          image_url: product.image_url,
          is_in_stock: product.is_in_stock && variant.is_purchasable,
          currency: product.currency,
          price: product.price,
          package_quantity: variant.package_quantity,
          carton_quantity: variant.carton_quantity,
          stock_quantity: variant.stock_quantity,
          quantity: requestedUnits,
        },
      ];
    }

    return currentItems.map((item) =>
      item.product_id === product.id && item.variant_id === variant.id
        ? { ...item, quantity: item.quantity + requestedUnits }
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
} as const;

type ProductDetailTab = "details" | "package" | "carton";

interface VariantSelectionState {
  variantId: string;
  unit: SalesUnit;
  quantity: number;
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [note, setNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<StorefrontProduct | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<ProductDetailTab>("details");
  const [selectedQuantity, setSelectedQuantity] = useState("0");
  const [selectedPackageCount, setSelectedPackageCount] = useState("0");
  const [selectedCartonCount, setSelectedCartonCount] = useState("0");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [variantSelections, setVariantSelections] = useState<VariantSelectionState[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
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
  const showBannerSection = !homeHref && selectedCategoryId === "all" && !searchTerm;
  const showSections = showBannerSection && sections.length > 0;
  const recommendedProducts = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.product_id));

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

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setHoveredCategoryId(null);
    setVisibleCount(24);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setVisibleCount(24);
  }

  function openProductDetail(product: StorefrontProduct) {
    setPreviewProduct(product);
    setActivePreviewTab("details");
  }

  function closeProductDetail() {
    setPreviewProduct(null);
    setActivePreviewTab("details");
  }

  function openCartDrawer() {
    setIsCartOpen(true);
  }

  function openAddToCartModal(product: StorefrontProduct) {
    if (!product.is_in_stock) {
      return;
    }

    setSelectedProduct(product);
    setSelectedQuantity("0");
    setSelectedPackageCount("0");
    setSelectedCartonCount("0");
    setVariantSelections([]);
    setQuantityError(null);
  }

  function openAddToCartFromDetail(product: StorefrontProduct) {
    closeProductDetail();
    openAddToCartModal(product);
  }

  function closeAddToCartModal() {
    setSelectedProduct(null);
    setSelectedQuantity("0");
    setSelectedPackageCount("0");
    setSelectedCartonCount("0");
    setVariantSelections([]);
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

        return !canSelectVariantUnit({
          unit: selection.unit,
          quantity: selection.quantity,
          variant,
        });
      });

      if (invalidSelection) {
        setQuantityError("Bazı model seçimleri için stok yetersiz.");
        return;
      }

      setQuantityError(null);

      void (async () => {
        const validation = await validateVariantSelections(selectedProduct, selections);

        if (!validation.ok) {
          setQuantityError(validation.error);
          return;
        }

        setCart((current) => addVariantSelectionsToCart(current, selectedProduct, selections));
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

    setCart((current) => addToCart(current, selectedProduct, selectedTotalQuantity));
    closeAddToCartModal();
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
  }

  function renderFloatingCartAction(product: StorefrontProduct, compact = false) {
    const cartQuantity = product.has_variants
      ? cartVariantCountByProductId.get(product.id) ?? 0
      : cartQuantityByProductId.get(product.id) ?? 0;

    if (!product.is_in_stock) {
      return null;
    }

    if (cartQuantity > 0) {
      return (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`stepper-${product.id}`}
            data-unit-picker-root="true"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={floatingActionTransition}
            className={cn(
              "absolute z-30 flex origin-top-right flex-col items-center rounded-[1.35rem] border border-emerald-400/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.98)_0%,rgba(5,150,105,0.96)_100%)] p-1 text-white shadow-[0_18px_40px_rgba(5,150,105,0.34)] backdrop-blur",
              compact ? "-right-2 -top-2" : "-right-2.5 -top-2.5 sm:-right-2 sm:-top-2",
              compact ? "w-10" : "w-11 sm:w-12",
            )}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={(event) => {
                event.stopPropagation();
                if (!product.has_variants) {
                  increaseCartItem(product);
                } else {
                  openAddToCartModal(product);
                }
              }}
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
              {product.has_variants ? `${cartQuantity}M` : cartQuantity}
            </motion.span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={(event) => {
                event.stopPropagation();
                if (!product.has_variants) {
                  decreaseCartItem(product);
                } else {
                  openAddToCartModal(product);
                }
              }}
              className={cn(
                "flex items-center justify-center rounded-full text-white transition hover:bg-white/15",
                compact ? "size-8" : "size-9 sm:size-10",
              )}
              aria-label={product.has_variants ? "Model seçimini aç" : cartQuantity === 1 ? "Ürünü sepetten çıkar" : "Adedi azalt"}
            >
              {!product.has_variants && cartQuantity === 1 ? (
                <Trash2 className={compact ? "size-4" : "size-4 sm:size-5"} />
              ) : (
                <Minus className={compact ? "size-4" : "size-4 sm:size-5"} />
              )}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      );
    }

    return (
      <motion.div
        layout
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "absolute z-30 origin-top-right",
          compact ? "-right-2 -top-2" : "-right-2.5 -top-2.5 sm:-right-2 sm:-top-2",
        )}
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.03 }}
          onClick={(event) => {
            event.stopPropagation();
            openAddToCartModal(product);
          }}
          className={cn(
            "flex items-center justify-center rounded-xl border border-emerald-600 bg-emerald-500 text-white shadow-[0_14px_30px_rgba(16,185,129,0.32)] transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-400",
            compact ? "size-8" : "size-9 sm:size-10",
          )}
          aria-label="Ürün ekleme birimini seç"
        >
          <Plus
            className={compact ? "size-3.5" : "size-4"}
            strokeWidth={2.8}
          />
        </motion.button>
      </motion.div>
    );
  }

  function renderProductCard(product: StorefrontProduct) {
    const handleOpenDetail = () => openProductDetail(product);
    const addedVariantCount = cartVariantCountByProductId.get(product.id) ?? 0;

    return (
      <article
        key={product.id}
        role="button"
        tabIndex={0}
        onClick={handleOpenDetail}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenDetail();
          }
        }}
        className={cn(
          theme.productCard,
          "relative overflow-visible cursor-pointer rounded-[1.2rem] border-slate-200/70 shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
          !product.is_in_stock && "opacity-60 saturate-50",
        )}
      >
        {renderFloatingCartAction(product, true)}
        <div className={cn(theme.productImageWrap, "overflow-hidden rounded-t-[1.2rem] p-2.5 sm:p-4")}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.product_name}
              fill
              className="object-contain p-3 transition duration-500 group-hover:scale-[1.04] sm:p-5"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-dashed border-slate-200/80 bg-white/70">
              <Store className="size-7 text-slate-300 sm:size-9" />
            </div>
          )}
          {!product.is_in_stock ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-slate-950/72 px-2 py-1.5 text-center backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-[11px]">
                Tükendi
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3.5">
          <p className={cn(theme.productPrice, "text-[11px] leading-4 sm:text-sm")}>
            {formatCurrency(product.price, product.currency)}
          </p>
          <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-slate-900 sm:text-[13px] sm:leading-5">
            {product.product_name}
          </p>
          <p className="truncate text-[10px] leading-4 text-slate-400 sm:text-[11px]">
            {product.sku_code ? `SKU: ${product.sku_code}` : "SKU bilgisi yok"}
          </p>
          {product.has_variants ? (
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge className="bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                {product.variants.length} model
              </Badge>
              {addedVariantCount > 0 ? (
                <Badge className="bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">
                  {addedVariantCount} Model Eklendi
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  function renderCrossSellCard(product: StorefrontProduct) {
    const cartQuantity = cartQuantityByProductId.get(product.id) ?? 0;

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

  function renderProductPreviewModal() {
    if (!previewProduct) {
      return null;
    }

    const tabItems: Array<{ key: ProductDetailTab; label: string }> = [
      { key: "details", label: "Detaylar" },
      { key: "package", label: "Paket" },
      { key: "carton", label: "Koli" },
    ];

    const detailContent =
      previewProduct.description?.trim() ||
      "Bu ürün için detay bilgisi eklenmedi.";
    const packageContent = previewProduct.package_quantity
      ? `1 Paket = ${previewProduct.package_quantity} adet`
      : "Paket bilgisi eklenmedi.";
    const cartonContent = previewProduct.carton_quantity
      ? `1 Koli = ${previewProduct.carton_quantity} adet`
      : "Koli bilgisi eklenmedi.";

    const tabContent =
      activePreviewTab === "details"
        ? detailContent
        : activePreviewTab === "package"
          ? packageContent
          : cartonContent;

    return (
      <Modal
        open={Boolean(previewProduct)}
        onClose={closeProductDetail}
        title="Ürün Detayı"
      >
        <div className="grid gap-4">
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
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
            <p className="text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(previewProduct.price, previewProduct.currency)}
            </p>
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

          <div className="min-h-[120px] rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm leading-6 text-slate-600">{tabContent}</p>
          </div>

          <Button
            type="button"
            onClick={() => openAddToCartFromDetail(previewProduct)}
            className="h-12 w-full rounded-full text-base font-bold"
          >
            Sepete Ekle
          </Button>
        </div>
      </Modal>
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
                      className="rounded-[1.55rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white sm:h-20 sm:w-20 sm:rounded-[1.35rem]">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-contain p-2.5 sm:p-3"
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
                                setCart((current) => updateQuantity(current, item.id, 0))
                              }
                              className="h-fit rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Ürünü sepetten çıkar"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-200/80 pt-3">
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

                        <div className="flex shrink-0 items-end gap-4 text-right">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Birim Fiyat
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {formatCurrency(item.price, item.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Ara Toplam
                            </p>
                            <p className="mt-1 text-base font-bold tracking-tight text-slate-950">
                              {formatCurrency(item.price * item.quantity, item.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

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
                      className="min-h-[84px] rounded-[1.1rem] border-slate-200 bg-slate-50/80 text-sm"
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
                  {cartTotalEntries.length ? (
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
                  asChild
                  href={whatsappHref}
                  className={cn(
                    "mt-3 h-11 w-full rounded-full px-5 text-base font-bold shadow-none sm:h-12",
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
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
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
      {renderProductPreviewModal()}

      <Modal
        open={Boolean(selectedProduct)}
        onClose={closeAddToCartModal}
        title={selectedProduct?.has_variants ? "Model Seçimi" : "Sepete Ekle"}
      >
        {selectedProduct ? (
          <form onSubmit={confirmAddToCart} className="grid gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{selectedProduct.product_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedProduct.sku_code || "SKU bilgisi yok"}
              </p>
              {!selectedProduct.has_variants && getUnitSummary(selectedProduct) ? (
                <p className="mt-1 text-sm text-slate-500">
                  {getUnitSummary(selectedProduct)}
                </p>
              ) : null}
              <p className="mt-3 text-lg font-bold text-slate-900">
                {formatCurrency(selectedProduct.price, selectedProduct.currency)}
              </p>
            </div>

            {selectedProduct.has_variants ? (
              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {selectedProduct.variants.map((variant) => {
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
                  const maxUnitCount = getMaxUnitCount(selection.unit, variant);
                  const isUnavailable = !variant.is_purchasable;

                  return (
                    <div
                      key={variant.id}
                      className={cn(
                        "rounded-2xl border px-4 py-4 transition",
                        isUnavailable
                          ? "border-slate-200 bg-slate-50 opacity-40"
                          : "border-slate-200 bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{variant.model_name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Stok: {variant.stock_quantity} adet
                          </p>
                        </div>
                        {isUnavailable ? (
                          <Badge className="bg-slate-200 text-slate-600">Tükendi</Badge>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
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
                          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 disabled:bg-slate-100"
                        >
                          {unitChoices.map((unitOption) => (
                            <option key={unitOption.value} value={unitOption.value}>
                              {unitOption.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          min="0"
                          max={maxUnitCount}
                          step="1"
                          inputMode="numeric"
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
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {variant.package_quantity ? (
                          <span>1 Paket = {variant.package_quantity} adet</span>
                        ) : null}
                        {variant.carton_quantity ? (
                          <span>1 Koli = {variant.carton_quantity} adet</span>
                        ) : null}
                        {!isUnavailable && maxUnitCount <= 0 ? (
                          <span className="font-semibold text-amber-700">Yetersiz Stok</span>
                        ) : null}
                        {!isUnavailable &&
                        selection.quantity > 0 &&
                        !canSelectVariantUnit({
                          unit: selection.unit,
                          quantity: selection.quantity,
                          variant,
                        }) ? (
                          <span className="font-semibold text-amber-700">Yetersiz Stok</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">ADET</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={selectedQuantity}
                    onChange={(event) => {
                      setSelectedQuantity(event.target.value);
                      if (quantityError) {
                        setQuantityError(null);
                      }
                    }}
                    placeholder="0"
                  />
                </div>

                {selectedProduct.package_quantity ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">
                      PAKET
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={selectedPackageCount}
                      onChange={(event) => {
                        setSelectedPackageCount(event.target.value);
                        if (quantityError) {
                          setQuantityError(null);
                        }
                      }}
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-500">
                      1 Paket = {selectedProduct.package_quantity} adet
                    </p>
                  </div>
                ) : null}

                {selectedProduct.carton_quantity ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">KOLİ</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={selectedCartonCount}
                      onChange={(event) => {
                        setSelectedCartonCount(event.target.value);
                        if (quantityError) {
                          setQuantityError(null);
                        }
                      }}
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-500">
                      1 Koli = {selectedProduct.carton_quantity} adet
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {quantityError ? <p className="text-sm text-amber-700">{quantityError}</p> : null}

            <div className="rounded-xl bg-slate-900 p-4 text-white">
              {selectedProduct.has_variants ? (
                <>
                  <p className="text-sm text-slate-300">Seçilen Modeller</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {
                      variantSelections.filter((selection) => selection.quantity > 0).length
                    }{" "}
                    model
                  </p>
                  <p className="mt-1 text-2xl font-bold">
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
                  <p className="text-sm text-slate-300">Toplam</p>
                  <p className="mt-1 text-sm text-slate-300">{selectedTotalQuantity} adet</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatCurrency(selectedLineTotal, selectedProduct.currency)}
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeAddToCartModal}>
                Vazgeç
              </Button>
              <Button type="submit">Sepete Ekle</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}