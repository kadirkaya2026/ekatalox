"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  Minus,
  Plus,
  Search,
  ShoppingBag,
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
import { supportedCurrencyCodes } from "@/lib/products/constants";
import {
  buildWhatsAppMessage,
  getCartCurrency,
  getCartTotal,
  getCartTotalsByCurrency,
} from "@/lib/storefront/cart";
import { storefrontThemes } from "@/lib/storefront/themes";
import type {
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const isMounted = useSyncExternalStore(
    subscribeToMountState,
    getClientMountedState,
    getServerMountedState,
  );

  const theme = storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;
  const cartStorageKey = useMemo(() => getCartStorageKey(tenant.id), [tenant.id]);
  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();

    products.forEach((product) => {
      counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
    });

    return [
      {
        id: "all",
        name: "Tüm Ürünler",
        count: products.length,
      },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: counts.get(category.id) ?? 0,
      })),
    ];
  }, [categories, products]);

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
        selectedCategoryId === "all" || product.category_id === selectedCategoryId;
      const productName = product.product_name.toLocaleLowerCase("tr-TR");
      const skuCode = product.sku_code?.toLocaleLowerCase("tr-TR") ?? "";
      const matchesSearch =
        !normalizedSearch ||
        productName.includes(normalizedSearch) ||
        skuCode.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategoryId]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

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
    storefrontSettings.storefront_description || "B2B Katalog ve Sipariş Portalı";
  const heroHeading =
    storefrontSettings.hero_heading || "Güncel fiyatlar ve hızlı sipariş tek ekranda";
  const heroCtaLabel = storefrontSettings.hero_cta_label || "Ürünleri İncele";

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

  function openAddToCartModal(product: StorefrontProduct) {
    setSelectedProduct(product);
    setSelectedQuantity("1");
    setQuantityError(null);
  }

  function handleCategoryChange(categoryId: string) {
    setSelectedCategoryId(categoryId);
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
    window.localStorage.removeItem(cartStorageKey);
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
                  <ShoppingBag className="size-10 text-slate-300" />
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
      <header className={theme.hero}>
        <div className="container-shell">
          <div className={theme.heroPanel}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {storefrontSettings.logo_url ? (
                      <Image
                        src={storefrontSettings.logo_url}
                        alt={`${storefrontTitle} logo`}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <Store className="size-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h1 className={theme.heroTitle}>{storefrontTitle}</h1>
                    <p className="text-sm font-semibold text-emerald-600">
                      {tenant.subdomain}.ekatalox.com
                    </p>
                  </div>
                </div>
                <p className={theme.heroDescription}>{storefrontDescription}</p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className={theme.heroHeading}>{heroHeading}</p>
                </div>
              </div>

              <Button
                className={theme.primaryButton}
                onClick={() => {
                  document.getElementById("catalog-grid")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {heroCtaLabel}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid min-w-0 max-w-full gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 max-w-full">
            <div className="grid min-w-0 max-w-full gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className={theme.categorySidebar}>
                  <p className={theme.categorySidebarTitle}>Kategoriler</p>
                  <nav aria-label="Kategoriler" className="space-y-2">
                    {categoryOptions.map((category) => {
                      const isActive = selectedCategoryId === category.id;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryChange(category.id)}
                          className={theme.categorySidebarItem(isActive)}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span className="truncate">{category.name}</span>
                          <span className={theme.categorySidebarCount(isActive)}>
                            {category.count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              <div className="min-w-0 space-y-6">
                <div className="space-y-2 lg:hidden">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Ürün Kategorileri
                  </h2>
                  <div className={theme.categoryRail}>
                    {categoryOptions.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryChange(category.id)}
                        className={theme.categoryChip(selectedCategoryId === category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={cn(theme.searchWrap, "max-w-2xl")}>
                  <Search className={theme.searchIcon} />
                  <Input
                    placeholder="Ürün adı veya SKU koduna göre arama yapın..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={theme.searchInput}
                  />
                </div>

                <div id="catalog-grid" className="min-w-0 max-w-full scroll-mt-6">
                  {filteredProducts.length ? (
                    <div className="grid min-w-0 max-w-full grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3">
                      {visibleProducts.map((product) => (
                        <article key={product.id} className={theme.productCard}>
                          <div className={theme.productImageWrap}>
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.product_name}
                                fill
                                className="object-contain transition duration-300 group-hover:scale-105"
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
                                {product.sku_code} •{" "}
                                {categoryNameMap.get(product.category_id) || "Genel"}
                              </p>
                            </div>

                            <div className="mt-4 min-w-0 border-t border-slate-100/20 pt-3">
                              <div className="space-y-2">
                                <div className="min-w-0 space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-2 sm:space-y-0">
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
                                  Ekle
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

                  {filteredProducts.length > visibleCount && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + 24)}
                        className="rounded-2xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow"
                      >
                        Daha Fazla Ürün Göster ({filteredProducts.length - visibleCount} ürün
                        kaldı)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="hidden 2xl:block">
            <div className={theme.desktopCartPanel}>
              <div className="flex items-center gap-2 border-b border-slate-100/20 pb-4">
                <ShoppingBag className="size-5 text-emerald-600" />
                <h3 className="text-lg font-bold">Sipariş Sepetiniz</h3>
                {isMounted ? (
                  <Badge className="ml-auto bg-emerald-50 font-bold text-emerald-700">
                    {cart.reduce((total, item) => total + item.quantity, 0)} ürün
                  </Badge>
                ) : null}
              </div>

              {isMounted && cart.length ? (
                <div className="mt-4 space-y-4">
                  <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-slate-100/20 bg-slate-50/40 p-3"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <Store className="m-auto mt-3 size-5 text-slate-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {item.product_name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatCurrency(item.price, item.currency)}
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsCartOpen(true)}
                            className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
                          >
                            Sepeti düzenle
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCart((current) => updateQuantity(current, item.id, 0))
                          }
                          className="h-fit p-1 text-slate-400 transition hover:text-rose-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-slate-900 p-4 text-white">
                    <p className="text-xs font-medium text-slate-400">
                      Toplam Sipariş Tutarı
                    </p>
                    <div className="mt-1 space-y-1">
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
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="w-full bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
                  >
                    Sepeti Aç ve Tamamla
                  </Button>
                </div>
              ) : (
                <div className="mt-8 text-center text-slate-400">
                  <ShoppingBag className="mx-auto size-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium">Sepetiniz şu an boş.</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vitrin listesindeki ürünleri inceleyip ekleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {isMounted && cart.length && !isSearchFocused ? (
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
                    <p key={currency} className={cn("truncate text-base leading-tight", theme.stickyCartText)}>
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
              {quantityError ? (
                <p className="text-sm text-amber-700">{quantityError}</p>
              ) : null}
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