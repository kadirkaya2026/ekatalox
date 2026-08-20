"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageOff, PencilLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MARKET_CATEGORY_ANCESTORS } from "@/lib/market-catalog/category-taxonomy";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MarketCatalogProduct } from "@/lib/types";

const CATEGORY_OPTIONS = Object.keys(MARKET_CATEGORY_ANCESTORS).sort((a, b) =>
  a.localeCompare(b, "tr-TR"),
);

const SEARCH_DEBOUNCE_MS = 350;

// Master Katalog TÜM tenant'ların ortak havuzu — buradaki bir düzenleme
// bundan sonra ürünü içe aktaracak her markete yansır (zaten aktarmış
// olanların kendi products satırı kopyalandığı için değişmez). Bu yüzden
// düzenleme yetkisi yalnızca süper adminde; tenant panelindeki katalog
// ekranı salt-okunur bir "içe aktar" seçicisi.
interface EditDraft {
  product_name: string;
  sku_code: string;
  brand: string;
  category_name: string;
  reference_price: string;
  description: string;
  image_url: string | null;
}

function toDraft(product: MarketCatalogProduct): EditDraft {
  return {
    product_name: product.product_name,
    sku_code: product.sku_code,
    brand: product.brand ?? "",
    category_name: product.category_name,
    reference_price:
      typeof product.reference_price === "number" ? String(product.reference_price) : "",
    description: product.description ?? "",
    image_url: product.image_url,
  };
}

export function MarketCatalogManager({
  initialProducts,
  initialTotal,
  pageSize,
}: {
  initialProducts: MarketCatalogProduct[];
  initialTotal: number;
  pageSize: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchTerm]);

  async function fetchPage(targetPage: number) {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(targetPage) });
      if (debouncedSearchTerm.trim()) params.set("q", debouncedSearchTerm.trim());

      const response = await fetch(`/api/admin/market-catalog?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Katalog yüklenemedi.");
        return;
      }

      setProducts(result.products as MarketCatalogProduct[]);
      setTotal(result.total as number);
    } finally {
      setIsLoading(false);
    }
  }

  function startEdit(product: MarketCatalogProduct) {
    setEditingId(product.id);
    setDraft(toDraft(product));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function updateDraft(patch: Partial<EditDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function uploadImage(product: MarketCatalogProduct, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingId(product.id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`/api/admin/market-catalog/${product.id}/image`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Görsel yüklenemedi.");
        return;
      }

      updateDraft({ image_url: result.imageUrl as string });
      setMessage("Görsel yüklendi. Kaydet'e basmayı unutmayın.");
    } finally {
      setUploadingId(null);
    }
  }

  async function save(product: MarketCatalogProduct) {
    if (!draft) return;

    const trimmedPrice = draft.reference_price.trim().replace(",", ".");
    const referencePrice = trimmedPrice ? Number(trimmedPrice) : null;

    if (referencePrice !== null && !Number.isFinite(referencePrice)) {
      setError("Referans fiyat sayı olmalı.");
      return;
    }

    setSavingId(product.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/market-catalog/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: draft.product_name,
          sku_code: draft.sku_code,
          brand: draft.brand,
          category_name: draft.category_name,
          reference_price: referencePrice,
          description: draft.description,
          image_url: draft.image_url,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Ürün kaydedilemedi.");
        return;
      }

      const updated = result.product as MarketCatalogProduct;
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage("Ürün güncellendi.");
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  }

  async function remove(product: MarketCatalogProduct) {
    const confirmed = window.confirm(
      `"${product.product_name}" Master Katalogdan silinsin mi?\n\nBu ürünü daha önce içe aktarmış marketlerin kendi listesi etkilenmez; ürün sadece bundan sonraki aramalarda çıkmaz.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/market-catalog/${product.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Ürün silinemedi.");
        return;
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));
      setTotal((current) => Math.max(0, current - 1));
      setMessage("Ürün katalogdan silindi.");
    } finally {
      setDeletingId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  return (
    <Card className="overflow-hidden">
      <div className="space-y-4 border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Master Katalog — {total.toLocaleString("tr-TR")} ürün
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tüm marketlerin ortak ürün havuzu. Buradaki düzenleme, ürünü bundan
              sonra içe aktaracak marketlere yansır.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Ürün adı, marka veya barkod ara"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
        <InlineAlert message={message} tone="success" onExpire={() => setMessage(null)} />
      </div>

      {isLoading ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</p>
      ) : !products.length ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Aramanıza uyan ürün bulunamadı.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {products.map((product) => {
            const isEditing = editingId === product.id;
            const activeDraft = isEditing ? draft : null;
            const shownImage = activeDraft ? activeDraft.image_url : product.image_url;

            return (
              <div key={product.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    {shownImage ? (
                      <Image
                        src={shownImage}
                        alt={product.product_name}
                        fill
                        sizes="64px"
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {product.product_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Barkod: {product.sku_code}
                      {product.brand ? ` • ${product.brand}` : ""} •{" "}
                      {formatDate(product.created_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="info">{product.category_name}</Badge>
                      <Badge variant="neutral">{product.source}</Badge>
                      {typeof product.reference_price === "number" ? (
                        <Badge variant="success">
                          {formatCurrency(product.reference_price, "TRY")}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Fiyatsız</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-2"
                      onClick={() => (isEditing ? cancelEdit() : startEdit(product))}
                    >
                      <PencilLine className="size-4" />
                      {isEditing ? "Kapat" : "Düzenle"}
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-2"
                      disabled={deletingId === product.id}
                      onClick={() => void remove(product)}
                    >
                      <Trash2 className="size-4" />
                      {deletingId === product.id ? "Siliniyor…" : "Sil"}
                    </Button>
                  </div>
                </div>

                {isEditing && activeDraft ? (
                  <div className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/40 p-4 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-foreground">Ürün adı</span>
                      <Input
                        value={activeDraft.product_name}
                        onChange={(event) => updateDraft({ product_name: event.target.value })}
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-foreground">Barkod</span>
                      <Input
                        value={activeDraft.sku_code}
                        onChange={(event) => updateDraft({ sku_code: event.target.value })}
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-foreground">Marka</span>
                      <Input
                        value={activeDraft.brand}
                        placeholder="Örn. Ülker"
                        onChange={(event) => updateDraft({ brand: event.target.value })}
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-foreground">Kategori</span>
                      <Select
                        value={activeDraft.category_name}
                        onChange={(event) => updateDraft({ category_name: event.target.value })}
                      >
                        {/* Taksonomide olmayan eski bir kategori adı varsa
                            listede görünsün ki kaydederken sessizce değişmesin. */}
                        {CATEGORY_OPTIONS.includes(activeDraft.category_name) ? null : (
                          <option value={activeDraft.category_name}>
                            {activeDraft.category_name} (taksonomi dışı)
                          </option>
                        )}
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-foreground">
                        Referans fiyat (₺)
                      </span>
                      <Input
                        inputMode="decimal"
                        placeholder="Boş bırakılabilir"
                        value={activeDraft.reference_price}
                        onChange={(event) =>
                          updateDraft({ reference_price: event.target.value })
                        }
                      />
                    </label>

                    <div className="text-sm">
                      <span className="mb-1 block font-medium text-foreground">Görsel</span>
                      <input
                        type="file"
                        accept="image/*"
                        id={`image-${product.id}`}
                        className="hidden"
                        onChange={(event) => void uploadImage(product, event)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          disabled={uploadingId === product.id}
                          onClick={() =>
                            document.getElementById(`image-${product.id}`)?.click()
                          }
                        >
                          {uploadingId === product.id
                            ? "Yükleniyor…"
                            : activeDraft.image_url
                              ? "Görseli değiştir"
                              : "Görsel yükle"}
                        </Button>
                        {activeDraft.image_url ? (
                          <Button
                            variant="ghost"
                            onClick={() => updateDraft({ image_url: null })}
                          >
                            Görseli kaldır
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block font-medium text-foreground">Açıklama</span>
                      <Textarea
                        rows={3}
                        value={activeDraft.description}
                        onChange={(event) => updateDraft({ description: event.target.value })}
                      />
                    </label>

                    <div className="flex gap-2 md:col-span-2">
                      <Button
                        disabled={savingId === product.id}
                        onClick={() => void save(product)}
                      >
                        {savingId === product.id ? "Kaydediliyor…" : "Kaydet"}
                      </Button>
                      <Button variant="ghost" onClick={cancelEdit}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button
            variant="secondary"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground">
            Sayfa {currentPage} / {pageCount}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage >= pageCount || isLoading}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          >
            Sonraki
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
