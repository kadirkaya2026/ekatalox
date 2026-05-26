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
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_60%)]"
      />
      <div className="relative min-h-[260px] md:min-h-[340px] lg:min-h-[400px]">
        {banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.title ?? `${title} banner`}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-[260px] items-center justify-center p-8 text-center text-white/70 md:min-h-[340px] lg:min-h-[400px]">
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
}: {
  tenant: Tenant;
  categories: Category[];
  products: StorefrontProduct[];
  storefrontSettings: TenantStorefrontSettings;
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
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const selectedQuantityValue = Number(selectedQuantity);
  const selectedLineTotal =
    selectedProduct && Number.isFinite(selectedQuantityValue) && selectedQuantityValue > 0
      ? selectedProduct.price * selectedQuantityValue
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
    setSelectedQuantity("1");
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
    setSelectedQuantity("1");
    setQuantityError(null);
  }

  function confirmAddToCart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    const quantity = Number(selectedQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setQuantityError("Lütfen geçerli bir adet girin.");
      return;
    }

    setCart((current) => addToCart(current, selectedProduct, quantity));
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
        <div className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.22)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[460px] lg:rounded-l-[2rem] lg:rounded-tr-none">
          <div className="flex h-full max-h-[88vh] flex-col lg:max-h-none">
            <div className="flex justify-center pt-3 lg:hidden">
              <span className="h-1.5 w-14 rounded-full bg-slate-200" />
            </div>

            <div className="border-b border-slate-100 px-5 pb-4 pt-3 lg:px-6 lg:pt-5">
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
                    <span className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
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

            <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-6">
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

            <div className="border-t border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 lg:px-6">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Sipariş Notu
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      İsterseniz teslimat veya sipariş detayını ekleyin.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    Opsiyonel
                  </span>
                </div>

                <Textarea
                  placeholder="Sipariş notu (opsiyonel)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-4 min-h-24 rounded-[1.25rem] border-slate-200 bg-slate-50/70"
                />

                <div className="mt-4 rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                        Toplamlar
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
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
                          className="flex items-center justify-between gap-3 rounded-full bg-white/5 px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-slate-300">{currency}</p>
                          <p className="text-lg font-bold tracking-tight text-white">
                            {formatCurrency(total, currency)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-full bg-white/5 px-4 py-3">
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
                    "mt-4 h-12 w-full rounded-full px-5 text-base font-bold shadow-none",
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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
                "h-11 max-w-none rounded-full border-slate-200/80 bg-slate-50 shadow-none lg:justify-self-center lg:w-full lg:max-w-md",
              )}
            >
              <Search className={cn(theme.searchIcon, "left-4 size-4 text-slate-400")} />
              <Input
                placeholder="Ürün adı, SKU veya kategoriye göre arayın..."
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className={cn(
                  theme.searchInput,
                  "h-11 rounded-full border-0 bg-transparent py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus:ring-0",
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
                          className="mb-2 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900"
                        >
                          <span>{category.name} içindeki tüm ürünler</span>
                          <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                            {categoryCounts.get(category.id) ?? 0}
                          </span>
                        </button>

                        <div className="space-y-2">
                          {category.children.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleCategoryChange(child.id)}
                              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <span>{child.name}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                                {categoryCounts.get(child.id) ?? 0}
                              </span>
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
                {topCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900"
                    >
                      <span>{category.name}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                        {categoryCounts.get(category.id) ?? 0}
                      </span>
                    </button>

                    {category.children.length ? (
                      <div className="mt-1 space-y-1 border-t border-slate-200 pt-2">
                        {category.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleCategoryChange(child.id)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-600"
                          >
                            <span>{child.name}</span>
                            <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                              {categoryCounts.get(child.id) ?? 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
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
                    <div className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-2">
                      <span className="max-w-[65%] truncate rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur">
                        {categoryNameMap.get(product.category_id) || "Genel"}
                      </span>
                      {product.sku_code ? (
                        <span className="max-w-[35%] truncate rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                          {product.sku_code}
                        </span>
                      ) : null}
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
        title={selectedProduct ? `${selectedProduct.product_name} • Sepete Ekle` : "Sepete Ekle"}
      >
        {selectedProduct ? (
          <form onSubmit={confirmAddToCart} className="grid gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{selectedProduct.product_name}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedProduct.sku_code}</p>
              <p className="mt-3 text-lg font-bold text-slate-900">
                {formatCurrency(selectedProduct.price, selectedProduct.currency)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">Adet</label>
              <Input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={selectedQuantity}
                onChange={(event) => {
                  setSelectedQuantity(event.target.value);
                  if (quantityError) {
                    setQuantityError(null);
                  }
                }}
                placeholder="Örn: 20"
              />
              {quantityError ? <p className="text-sm text-amber-700">{quantityError}</p> : null}
            </div>

            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-sm text-slate-300">Toplam</p>
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