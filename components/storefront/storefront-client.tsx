"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function StorefrontClient({
  tenant,
  categories,
  products,
  storefrontSettings,
  sections = [],
  subdomain,
}: {
  tenant: Tenant;
  categories: Category[];
  products: StorefrontProduct[];
  storefrontSettings: TenantStorefrontSettings;
  sections?: StorefrontSectionWithProducts[];
  subdomain?: string;
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
  const [selectedQuantity, setSelectedQuantity] = useState("0");
  const [selectedPackageCount, setSelectedPackageCount] = useState("0");
  const [selectedCartonCount, setSelectedCartonCount] = useState("0");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null);
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

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);
  const cartCurrency = useMemo(() => getCartCurrency(cart), [cart]);
  const cartTotalsByCurrency = useMemo(() => getCartTotalsByCurrency(cart), [cart]);
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

  const selectedQuantityValue = parseUnitCount(selectedQuantity);
  const selectedPackageCountValue = parseUnitCount(selectedPackageCount);
  const selectedCartonCountValue = parseUnitCount(selectedCartonCount);
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

  function openAddToCartModal(product: StorefrontProduct) {
    setSelectedProduct(product);
    setSelectedQuantity("0");
    setSelectedPackageCount("0");
    setSelectedCartonCount("0");
    setQuantityError(null);
  }

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setMobileMenuOpen(false);
    setHoveredCategoryId(null);
    setVisibleCount(24);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setVisibleCount(24);
  }

  function closeAddToCartModal() {
    setSelectedProduct(null);
    setSelectedQuantity("0");
    setSelectedPackageCount("0");
    setSelectedCartonCount("0");
    setQuantityError(null);
  }

  function confirmAddToCart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    if (
      selectedQuantityValue === null ||
      selectedPackageCountValue === null ||
      selectedCartonCountValue === null
    ) {
      setQuantityError("Lütfen adet, paket ve koli alanlarına geçerli tam sayı girin.");
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

  function clearCart() {
    setCart([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(cartStorageKey);
    }
    setIsMobileOrderNoteOpen(false);
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
                      {cartItemCount} ürün
                    </span>
                    <span className="hidden rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline-flex">
                      Hızlı sipariş özeti
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length ? (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Sepeti Boşalt
                    </button>
                  ) : null}
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

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
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
                        <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity - 1),
                              )
                            }
                            className="flex size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
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
                            className="h-9 w-14 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                            aria-label="Ürün adedi"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity + 1),
                              )
                            }
                            className="flex size-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                            aria-label="Adedi artır"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <div className="text-right">
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
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:rounded-[1.75rem] sm:p-4">
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
                  className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left md:hidden"
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
                    "mt-4 rounded-[1.25rem] border-slate-200 bg-slate-50/70",
                    isMobileOrderNoteOpen ? "block min-h-20" : "hidden md:block md:min-h-24",
                  )}
                />

                <div className="mt-3 rounded-[1.35rem] bg-slate-950 p-3 text-white shadow-[0_18px_48px_rgba(15,23,42,0.24)] sm:mt-4 sm:rounded-[1.5rem] sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                        Toplamlar
                      </p>
                      <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                        {cartItemCount} ürün için sipariş özeti
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                      Hazır
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {cartTotalEntries.length ? (
                      cartTotalEntries.map(({ currency, total }) => (
                        <div
                          key={currency}
                          className="flex items-center justify-between gap-3 rounded-full bg-white/5 px-4 py-2.5 sm:py-3"
                        >
                          <p className="text-sm font-semibold text-slate-300">{currency}</p>
                          <p className="text-lg font-bold tracking-tight text-white">
                            {formatCurrency(total, currency)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-full bg-white/5 px-4 py-2.5 sm:py-3">
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
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white md:hidden"
                onClick={() => setMobileMenuOpen((current) => !current)}
                aria-label="Menüyü aç"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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
              </div>
            </div>

            <div
              className={cn(
                theme.searchWrap,
                "h-10 min-w-0 max-w-none rounded-full border-slate-200/80 bg-slate-50 shadow-none lg:h-11 lg:justify-self-center lg:w-full lg:max-w-md",
              )}
            >
              <Search className={cn(theme.searchIcon, "left-4 size-4 text-slate-400")} />
              <Input
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
                onClick={() => setIsCartOpen(true)}
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
              className={cn(
                "relative hidden md:flex md:flex-wrap md:items-start md:gap-2 md:py-3",
                mobileMenuOpen && "md:flex",
              )}
              aria-label="Ana kategoriler"
            >
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
                      <div className="absolute left-0 top-full z-30 mt-2 min-w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(category.id)}
                          className="mb-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900"
                        >
                          {category.name} içindeki tüm ürünler
                        </button>

                        <div className="space-y-2">
                          {category.children.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleCategoryChange(child.id)}
                              className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            {mobileMenuOpen ? (
              <div className="space-y-2 border-t border-slate-100 py-3 md:hidden">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className={cn(
                    "w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold",
                    selectedCategoryId === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700",
                  )}
                >
                  Tüm Ürünler
                </button>
                {topCategories.map((category) => {
                  const isExpanded = expandedMobileCategoryId === category.id;
                  return (
                  <div
                    key={category.id}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-2"
                  >
                    <div className="flex w-full items-center">
                      <button
                        type="button"
                        onClick={() => handleCategoryChange(category.id)}
                        className="flex-1 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900"
                      >
                        {category.name}
                      </button>
                      {category.children.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMobileCategoryId(isExpanded ? null : category.id)
                          }
                          className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200"
                          aria-label={isExpanded ? "Alt kategorileri kapat" : "Alt kategorileri aç"}
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-200",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>
                      ) : null}
                    </div>

                    {category.children.length && isExpanded ? (
                      <div className="mt-1 space-y-1 border-t border-slate-200 pt-2">
                        {category.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleCategoryChange(child.id)}
                            className="w-full rounded-xl px-3 py-3 text-left text-sm text-slate-600"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container-shell py-5 sm:py-6">
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

        {sections.length > 0 ? (
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
                    {visibleSectionProducts.map((product) => (
                      <article key={product.id} className={theme.productCard}>
                        <div className={cn(theme.productImageWrap, "p-4 sm:p-5")}>
                          <div className="absolute left-3 right-3 top-3 z-10 flex items-start">
                            <span className="max-w-[58%] truncate rounded-full border border-white/70 bg-white/80 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 backdrop-blur sm:max-w-[62%] sm:px-3 sm:py-1 sm:text-[10px]">
                              {categoryNameMap.get(product.category_id) || "Genel"}
                            </span>
                          </div>
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

                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <div className="flex-1 space-y-2">
                            <p className={theme.productTitle}>{product.product_name}</p>
                            <p className={theme.productMeta}>
                              {product.sku_code
                                ? `SKU: ${product.sku_code}`
                                : "SKU bilgisi tanımlanmadı"}
                            </p>
                            {getUnitSummary(product) ? (
                              <p className="text-xs text-slate-500">{getUnitSummary(product)}</p>
                            ) : null}
                          </div>

                          <div className="mt-5 border-t border-slate-100/80 pt-4">
                            <div className="space-y-3">
                              <div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
                                <p className={theme.productPrice}>
                                  {formatCurrency(product.price, product.currency)}
                                </p>
                                <div className="shrink-0">
                                  {product.is_in_stock ? (
                                    <span className={theme.stockBadgeIn}>Stokta</span>
                                  ) : (
                                    <span className={theme.stockBadgeOut}>Tükendi</span>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => openAddToCartModal(product)}
                                disabled={!product.is_in_stock}
                                className={cn(
                                  "h-11 w-full rounded-full border-0 shadow-none",
                                  product.is_in_stock
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-100",
                                )}
                                variant="secondary"
                              >
                                <Plus className="mr-1 size-4" />
                                Sepete Ekle
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
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
                Ürünler
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
              {visibleProducts.map((product) => (
                <article key={product.id} className={theme.productCard}>
                  <div className={cn(theme.productImageWrap, "p-4 sm:p-5")}>
                    <div className="absolute left-3 right-3 top-3 z-10 flex items-start">
                      <span className="max-w-[58%] truncate rounded-full border border-white/70 bg-white/80 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 backdrop-blur sm:max-w-[62%] sm:px-3 sm:py-1 sm:text-[10px]">
                        {categoryNameMap.get(product.category_id) || "Genel"}
                      </span>
                    </div>
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

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex-1 space-y-2">
                      <p className={theme.productTitle}>{product.product_name}</p>
                      <p className={theme.productMeta}>
                        {product.sku_code
                          ? `SKU: ${product.sku_code}`
                          : "SKU bilgisi tanımlanmadı"}
                      </p>
                      {getUnitSummary(product) ? (
                        <p className="text-xs text-slate-500">{getUnitSummary(product)}</p>
                      ) : null}
                    </div>

                    <div className="mt-5 border-t border-slate-100/80 pt-4">
                      <div className="space-y-3">
                        <div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
                          <p className={theme.productPrice}>
                            {formatCurrency(product.price, product.currency)}
                          </p>
                          <div className="shrink-0">
                            {product.is_in_stock ? (
                              <span className={theme.stockBadgeIn}>Stokta</span>
                            ) : (
                              <span className={theme.stockBadgeOut}>Tükendi</span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => openAddToCartModal(product)}
                          disabled={!product.is_in_stock}
                          className={cn(
                            "h-11 w-full rounded-full border-0 shadow-none",
                            product.is_in_stock
                              ? "bg-slate-900 text-white hover:bg-slate-800"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-100",
                          )}
                          variant="secondary"
                        >
                          <Plus className="mr-1 size-4" />
                          Sepete Ekle
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
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

      {isMounted && cart.length ? (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className={cn(theme.stickyCart, "text-left 2xl:hidden")}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Sepet Toplamı
              </p>
              <div className="mt-0.5 space-y-0.5">
                {cartTotalEntries.length ? (
                  cartTotalEntries.map(({ currency, total }) => (
                    <p
                      key={currency}
                      className={cn("truncate text-base leading-tight", theme.stickyCartText)}
                    >
                      {currency}: {formatCurrency(total, currency)}
                    </p>
                  ))
                ) : (
                  <p className={cn("truncate text-base leading-tight", theme.stickyCartText)}>
                    {formatCurrency(cartTotal, cartCurrency)}
                  </p>
                )}
              </div>
            </div>
            <span className={cn(theme.stickyCartButton, "rounded-full")}>Sepeti Aç</span>
          </div>
        </button>
      ) : null}

      {renderCartDrawer()}

      <Modal
        open={Boolean(selectedProduct)}
        onClose={closeAddToCartModal}
        title="Sepete Ekle"
      >
        {selectedProduct ? (
          <form onSubmit={confirmAddToCart} className="grid gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{selectedProduct.product_name}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedProduct.sku_code}</p>
              {getUnitSummary(selectedProduct) ? (
                <p className="mt-1 text-sm text-slate-500">{getUnitSummary(selectedProduct)}</p>
              ) : null}
              <p className="mt-3 text-lg font-bold text-slate-900">
                {formatCurrency(selectedProduct.price, selectedProduct.currency)}
              </p>
            </div>

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
                  <label className="text-sm font-semibold text-slate-900">PAKET</label>
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
                </div>
              ) : null}
            </div>
            {quantityError ? <p className="text-sm text-amber-700">{quantityError}</p> : null}

            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-sm text-slate-300">Toplam</p>
              <p className="mt-1 text-sm text-slate-300">{selectedTotalQuantity} adet</p>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(selectedLineTotal, selectedProduct.currency)}
              </p>
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