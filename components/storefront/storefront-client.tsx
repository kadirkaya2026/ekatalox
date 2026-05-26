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
import { Badge } from "@/components/ui/badge";
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

function renderBannerItem(banner: BannerItem, index: number, title: string) {
  return (
    <div
      key={banner.id}
      className="relative min-h-[240px] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-sm"
      style={{
        background:
          banner.background_color ??
          (index % 2 === 0
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #065f46 0%, #10b981 100%)"),
      }}
    >
      <div className="grid h-full gap-6 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
        <div className={cn("flex flex-col justify-center", banner.image_url ? "" : "md:max-w-2xl")}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            Kampanya Alanı
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-4xl">
            {banner.title ?? `${title} için öne çıkan fırsatlar`}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            {banner.description ??
              "Esnafınıza özel kampanya, duyuru ve indirim içeriklerini bu alanda yayınlayabilirsiniz."}
          </p>
          {banner.cta_label && banner.cta_href ? (
            <Button
              asChild
              href={banner.cta_href}
              className="mt-6 w-fit rounded-xl bg-white text-slate-900 hover:bg-slate-100"
            >
              {banner.cta_label}
            </Button>
          ) : null}
        </div>

        <div className="relative min-h-[180px] overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/10">
          {banner.image_url ? (
            <Image
              src={banner.image_url}
              alt={banner.title ?? `${title} banner`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-white/70">
              <div>
                <p className="text-lg font-semibold">Banner görseli eklenmedi</p>
                <p className="mt-2 text-sm leading-6">
                  Yönetim panelinden bu segmente görsel, bağlantı ve CTA tanımlayabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>
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
  const storefrontTitle = storefrontSettings.storefront_title || tenant.company_name;
  const storefrontDescription =
    storefrontSettings.storefront_description || "Profesyonel B2B vitrin ve sipariş deneyimi";

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
      <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm">
        <div className="absolute inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl bg-white shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[440px] lg:rounded-l-3xl lg:rounded-tr-none">
          <div className="flex h-full max-h-[88vh] flex-col lg:max-h-none">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Sipariş Özeti
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Sepetim</h2>
              </div>
              <div className="flex items-center gap-2">
                {cart.length ? (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Sepeti Boşalt
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Sepeti kapat"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Store className="size-5 text-slate-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {item.product_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.sku_code} • {formatCurrency(item.price, item.currency)}
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

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity - 1),
                              )
                            }
                            className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-50"
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
                            className="h-10 w-16 border-x border-slate-200 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                            aria-label="Ürün adedi"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity + 1),
                              )
                            }
                            className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-50"
                            aria-label="Adedi artır"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.price * item.quantity, item.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                  <ShoppingCart className="size-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Sepetiniz şu an boş.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ürünleri inceleyip sepete ekleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-5 py-4">
              <Textarea
                placeholder="Sipariş notu (opsiyonel)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />

              <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Toplamlar
                </p>
                <div className="mt-2 space-y-1">
                  {cartTotalEntries.length ? (
                    cartTotalEntries.map(({ currency, total }) => (
                      <p key={currency} className="text-xl font-bold">
                        {currency}: {formatCurrency(total, currency)}
                      </p>
                    ))
                  ) : (
                    <p className="text-xl font-bold">
                      {formatCurrency(cartTotal, cartCurrency)}
                    </p>
                  )}
                </div>
              </div>

              <Button
                asChild
                href={whatsappHref}
                className={cn(
                  "mt-4 w-full py-3 text-base font-bold",
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
    );
  }

  return (
    <div className="contents">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container-shell py-3">
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_220px] md:items-center">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white md:hidden"
                onClick={() => setMobileMenuOpen((current) => !current)}
                aria-label="Menüyü aç"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
                  <p className="truncate text-base font-bold text-slate-900">
                    {storefrontTitle}
                  </p>
                  <p className="truncate text-xs text-slate-500">{tenant.subdomain}.ekatalox.com</p>
                </div>
              </div>
            </div>

            <div className={cn(theme.searchWrap, "max-w-none")}>
              <Search className={theme.searchIcon} />
              <Input
                placeholder="Ürün adı, SKU veya kategoriye göre arayın..."
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className={theme.searchInput}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sepet Toplamı</p>
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
                className="relative flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="Sepeti aç"
              >
                <ShoppingCart className="size-5" />
                {cart.length ? (
                  <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
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
                "relative hidden md:flex md:items-center md:gap-1 md:py-2",
                mobileMenuOpen && "md:flex",
              )}
              aria-label="Ana kategoriler"
            >
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-semibold transition",
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
                    className="relative"
                    onMouseEnter={() => setHoveredCategoryId(category.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
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
              <div className="space-y-2 py-3 md:hidden">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-left text-sm font-semibold",
                    selectedCategoryId === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700",
                  )}
                >
                  Tüm Ürünler
                </button>
                {topCategories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
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

      <main className="container-shell py-6">
        <section className="mb-6 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <Badge className="bg-emerald-50 text-emerald-700">Canlı mağaza vitrini</Badge>
              <h1 className={cn(theme.heroTitle, "mt-4")}>{storefrontTitle}</h1>
              <p className={cn(theme.heroDescription, "mt-4 max-w-2xl")}>
                {storefrontDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className={theme.primaryButton}
                  onClick={() =>
                    document.getElementById("catalog-grid")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Ürünleri İncele
                </Button>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Aktif Ürün
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{products.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Kategori</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{categories.length}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sepet Ürün</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hızlı Erişim</p>
                  <p className="mt-2 text-base font-bold text-slate-900">Arama + Menü + Sepet</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          {bannerItems.length ? (
            <div className="space-y-4">
              {currentBanner ? renderBannerItem(currentBanner, activeBannerIndex, storefrontTitle) : null}
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
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900">Banner alanı şu an boş</p>
              <p className="mt-2 text-sm text-slate-500">
                Admin panelindeki vitrin ayarlarından kampanya banner’ları ekleyebilirsiniz.
              </p>
            </div>
          )}
        </section>

        <section id="catalog-grid" className="scroll-mt-28">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Ürün Vitrini
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filtrelenmiş ürünler responsive grid yapısında listelenir.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <span className="font-semibold text-slate-900">{filteredProducts.length}</span> ürün bulundu
            </div>
          </div>

          {filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <article key={product.id} className={theme.productCard}>
                  <div className={theme.productImageWrap}>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.product_name}
                        fill
                        className="object-contain transition duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Store className="size-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <div className="flex-1 space-y-1">
                      <p className={theme.productTitle}>{product.product_name}</p>
                      <p className={theme.productMeta}>
                        {product.sku_code} • {categoryNameMap.get(product.category_id) || "Genel"}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-slate-100/80 pt-3">
                      <div className="space-y-2">
                        <div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-2 sm:space-y-0">
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
                          className="w-full rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200"
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
            <Card className="border-dashed bg-transparent p-8 text-center">
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
                className="rounded-2xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow"
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
            <span className={theme.stickyCartButton}>Sepeti Aç</span>
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