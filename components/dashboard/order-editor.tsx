"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CurrencyCode } from "@/lib/products/constants";
import type { Product, StorefrontOrder } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

// Sipariş fişi düzenleyici (0154): müşteri bilgileri, satır adet/fiyat/çıkarma ve
// ürün arayıp ekleme. Kaydet → PUT /api/tenant/orders/[id]/edit (hesap ve stok
// farkı sunucuda). Yeni ürünün fiyatı sunucuda siparişin fiyat listesinden gelir;
// burada boş bırakılırsa o fiyat kullanılır, yazılırsa yazılan geçer.
type Line =
  | { key: string; kind: "existing"; index: number; name: string; quantity: number; price: string }
  | { key: string; kind: "new"; productId: string; name: string; sku: string | null; quantity: number; price: string };

export function OrderEditor({
  order,
  onCancel,
  onSaved,
}: {
  order: StorefrontOrder;
  onCancel: () => void;
  onSaved: (order: StorefrontOrder, changesNote: string | null) => void;
}) {
  const priced = order.currency !== "CATALOG";
  const money = (value: number) => formatCurrency(value, order.currency as CurrencyCode);
  const [customer, setCustomer] = useState({
    customer_name: order.customer_name ?? "",
    customer_phone: order.customer_phone ?? "",
    customer_address: order.customer_address ?? "",
    note: order.note ?? "",
  });
  const [lines, setLines] = useState<Line[]>(() =>
    order.items.map((item, index) => ({
      key: `e${index}`,
      kind: "existing" as const,
      index,
      name: item.product_name + (item.variant_name ? ` · ${item.variant_name}` : ""),
      quantity: item.quantity,
      price: item.price !== null ? String(item.price) : "0",
    })),
  );
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/tenant/products?page=1&q=${encodeURIComponent(term)}`);
        const result = await response.json().catch(() => ({}));
        setResults(Array.isArray(result.products) ? (result.products as Product[]).slice(0, 8) : []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.price.replace(",", ".")) || 0) * line.quantity, 0),
    [lines],
  );
  const oldSub = order.items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  // Sunucudaki hesapla aynı: eski toplam + ara toplam farkı (kupon/indirim korunur).
  const previewTotal = Math.max(order.total_amount + total - oldSub, 0);

  function updateLine(key: string, patch: Partial<{ quantity: number; price: string }>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addProduct(product: Product) {
    setLines((current) => {
      const existing = current.find((line) => line.kind === "new" && line.productId === product.id);
      if (existing) return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      return [
        ...current,
        { key: `n${product.id}`, kind: "new", productId: product.id, name: product.product_name, sku: product.sku_code ?? null, quantity: 1, price: "" },
      ];
    });
    setSearch("");
    setResults([]);
  }

  async function save() {
    if (!lines.length) {
      setError("Fişte en az bir ürün kalmalı; tamamını kaldırmak için siparişi iptal edin.");
      return;
    }
    setSaving(true);
    setError(null);
    const items = lines.map((line) => {
      const price = line.price.trim() === "" ? undefined : Number(line.price.replace(",", "."));
      return line.kind === "existing"
        ? { index: line.index, quantity: line.quantity, ...(priced && price !== undefined ? { price } : {}) }
        : { product_id: line.productId, quantity: line.quantity, ...(priced && price !== undefined ? { price } : {}) };
    });
    const response = await fetch(`/api/tenant/orders/${order.id}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, customer }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Sipariş güncellenemedi.");
      return;
    }
    onSaved(result.order as StorefrontOrder, null);
  }

  return (
    <div className="space-y-4 rounded-xl border border-amber-300 bg-amber-50/40 p-4">
      <p className="text-sm font-semibold text-slate-900">Siparişi düzenle</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600">
          Müşteri adı
          <Input value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} className="mt-1" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Telefon
          <Input value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} className="mt-1" inputMode="tel" />
        </label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
          Adres
          <Input value={customer.customer_address} onChange={(e) => setCustomer({ ...customer, customer_address: e.target.value })} className="mt-1" />
        </label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
          Not
          <Textarea rows={2} value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} className="mt-1" />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_90px_120px_110px_36px] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Ürün</span>
          <span className="text-right">Adet</span>
          <span className="text-right">{priced ? "Birim fiyat" : ""}</span>
          <span className="text-right">{priced ? "Tutar" : ""}</span>
          <span />
        </div>
        {lines.map((line) => {
          const unit = Number(line.price.replace(",", ".")) || 0;
          return (
            <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_90px_36px] items-center gap-2 border-t border-slate-100 px-3 py-2 text-sm first:border-t-0 sm:grid-cols-[minmax(0,1fr)_90px_120px_110px_36px]">
              <p className="min-w-0 text-slate-900">
                {line.name}
                {line.kind === "new" ? <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">yeni</span> : null}
              </p>
              <Input
                type="number"
                min={1}
                step={1}
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                className="h-8 px-2 text-right tabular-nums"
                aria-label="Adet"
              />
              {priced ? (
                <Input
                  inputMode="decimal"
                  value={line.price}
                  placeholder={line.kind === "new" ? "liste fiyatı" : "0"}
                  onChange={(e) => updateLine(line.key, { price: e.target.value })}
                  className="col-start-1 h-8 px-2 text-right tabular-nums sm:col-start-auto"
                  aria-label="Birim fiyat"
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              <span className="hidden text-right tabular-nums text-slate-700 sm:block">
                {priced && line.price.trim() !== "" ? money(unit * line.quantity) : ""}
              </span>
              <button
                type="button"
                title="Satırı fişten çıkar"
                onClick={() => setLines((current) => current.filter((x) => x.key !== line.key))}
                className="justify-self-end rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        <div className="border-t border-slate-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Fişe ürün ekle: ad ya da kod yazın"
              className="pl-9"
            />
            {searching ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" /> : null}
          </div>
          {results.length && search.trim().length >= 2 ? (
            <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <Plus className="size-4 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate">{product.product_name}</span>
                  {product.sku_code ? <span className="shrink-0 text-xs text-slate-400">{product.sku_code}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {priced ? (
        <p className="text-right text-sm text-slate-600">
          Yeni toplam: <span className={cn("font-semibold tabular-nums text-slate-900")}>{money(previewTotal)}</span>
          {lines.some((line) => line.kind === "new" && line.price.trim() === "") ? (
            <span className="block text-xs text-slate-400">Fiyatı boş bırakılan yeni ürünler müşterinin fiyat listesindeki fiyatla eklenir.</span>
          ) : null}
        </p>
      ) : null}

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Kaydet
        </Button>
      </div>
    </div>
  );
}
