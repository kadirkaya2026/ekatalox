"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  buildWhatsAppMessage,
  getCartTotalsByCurrency,
  getCartCurrency,
  getCartTotal,
} from "@/lib/storefront/cart";
import type { CartItem, Category, StorefrontProduct, Tenant } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { supportedCurrencyCodes } from "@/lib/products/constants";

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

export function StorefrontClient({
  tenant,
  categories,
  products,
}: {
  tenant: Tenant;
  categories: Category[];
  products: StorefrontProduct[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);

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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return products.filter((product) =>
        selectedCategoryId === "all" ? true : product.category_id === selectedCategoryId,
      );
    }

    return products.filter((product) => {
      return (
        (selectedCategoryId === "all" || product.category_id === selectedCategoryId) &&
        product.product_name.toLowerCase().includes(normalizedSearch) ||
        ((selectedCategoryId === "all" || product.category_id === selectedCategoryId) &&
          product.sku_code.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [products, searchTerm, selectedCategoryId]);
  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
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

  function openAddToCartModal(product: StorefrontProduct) {
    setSelectedProduct(product);
    setSelectedQuantity("1");
    setQuantityError(null);
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

  return (
    <div className="sticky-safe-bottom">
      <div className="container-shell py-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-3xl bg-slate-900 px-5 py-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Kapalı Devre B2B Katalog
              </p>
              <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
                {tenant.company_name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Görseller, stok ve size tanımlı fiyat katmanı ile hızlı sipariş hazırlayın.
              </p>
            </div>

            <div className="mt-6">
              <Input
                placeholder="Ürün adı veya SKU ara"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-white"
              />
            </div>

            <Card className="mt-4 p-4">
              <p className="text-sm font-semibold text-slate-900">Ürün Kategorileri</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant={selectedCategoryId === "all" ? "primary" : "secondary"}
                  onClick={() => setSelectedCategoryId("all")}
                >
                  Tüm ürünleri göster
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategoryId === category.id ? "primary" : "secondary"}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </Card>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative h-52 bg-slate-100">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.product_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {product.product_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.sku_code} • {categoryNameMap.get(product.category_id) ?? "Kategori yok"}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          product.is_in_stock
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {product.is_in_stock ? "Stokta" : "Stok kapalı"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Fiyatınız
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {formatCurrency(product.price, product.currency)}
                        </p>
                      </div>

                      <Button
                        onClick={() => openAddToCartModal(product)}
                        disabled={!product.is_in_stock}
                      >
                        <Plus className="size-4" />
                        Sepete ekle
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {!filteredProducts.length ? (
              <Card className="mt-6 p-6">
                <p className="text-sm font-semibold text-slate-900">
                  Aramanıza uygun ürün bulunamadı.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ürün adını, SKU kodunu veya seçili kategoriyi değiştirip tekrar deneyin.
                </p>
              </Card>
            ) : null}
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Sipariş Özeti</h2>
                  <p className="text-sm text-slate-500">{cart.length} kalem ürün</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {cart.length ? (
                  cart.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.product_name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatCurrency(item.price, item.currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCart((current) => updateQuantity(current, item.id, 0))}
                          className="text-slate-400 transition hover:text-slate-900"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity - 1),
                              )
                            }
                            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                updateQuantity(current, item.id, item.quantity + 1),
                              )
                            }
                            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(item.quantity * item.price, item.currency)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Henüz sepetinize ürün eklemediniz.
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <Textarea
                  placeholder="Sipariş notu (opsiyonel)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <div className="rounded-2xl bg-slate-900 p-4 text-white">
                  <p className="text-sm text-slate-300">Toplam</p>
                  <div className="mt-2 space-y-1">
                    {cartTotalEntries.length ? (
                      cartTotalEntries.map(({ currency, total }) => (
                        <p key={currency} className="text-2xl font-bold">
                          {currency}: {formatCurrency(total, currency)}
                        </p>
                      ))
                    ) : (
                      <p className="text-2xl font-bold">
                        {formatCurrency(cartTotal, cartCurrency)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  asChild
                  href={whatsappHref}
                  className={cn("w-full", !cart.length && "pointer-events-none opacity-50")}
                >
                  WhatsApp&apos;tan Sipariş Ver
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur xl:hidden">
        <div className="container-shell flex items-center gap-3 px-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sepet toplamı</p>
            <div className="mt-1 space-y-1">
              {cartTotalEntries.length ? (
                cartTotalEntries.map(({ currency, total }) => (
                  <p key={currency} className="truncate text-lg font-bold text-slate-900">
                    {currency}: {formatCurrency(total, currency)}
                  </p>
                ))
              ) : (
                <p className="truncate text-lg font-bold text-slate-900">
                  {formatCurrency(cartTotal, cartCurrency)}
                </p>
              )}
            </div>
          </div>
          <Button
            asChild
            href={whatsappHref}
            className={cn("shrink-0", !cart.length && "pointer-events-none opacity-50")}
          >
            WhatsApp&apos;tan Sipariş Ver
          </Button>
        </div>
      </div>

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