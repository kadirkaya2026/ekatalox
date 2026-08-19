"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Select } from "@/components/ui/select";
import { MARKET_CATEGORY_ANCESTORS } from "@/lib/market-catalog/category-taxonomy";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProductSuggestionWithTenant } from "@/lib/types";

const CATEGORY_OPTIONS = Object.keys(MARKET_CATEGORY_ANCESTORS).sort((a, b) =>
  a.localeCompare(b, "tr-TR"),
);

// Onaylamadan önce düzenlenebilen alanlar — boş bırakılırsa önerideki
// orijinal değer kullanılır (bkz. approve/route.ts). Görsel de burada
// tutulur, yüklenince /upload-image'dan dönen public URL saklanır.
interface SuggestionEdit {
  productName: string;
  barcode: string;
  price: string;
  imageUrl: string | null;
}

export function ProductSuggestionsPanel({
  initialSuggestions,
}: {
  initialSuggestions: ProductSuggestionWithTenant[];
}) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryByRow, setCategoryByRow] = useState<Record<string, string>>({});
  const [editsByRow, setEditsByRow] = useState<Record<string, SuggestionEdit>>({});
  const [imageUploadPendingId, setImageUploadPendingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function getEdit(suggestion: ProductSuggestionWithTenant): SuggestionEdit {
    return (
      editsByRow[suggestion.id] ?? {
        productName: suggestion.product_name,
        barcode: suggestion.barcode,
        price: typeof suggestion.price === "number" ? String(suggestion.price) : "",
        imageUrl: suggestion.image_url,
      }
    );
  }

  function updateEdit(suggestion: ProductSuggestionWithTenant, patch: Partial<SuggestionEdit>) {
    setEditsByRow((current) => ({
      ...current,
      [suggestion.id]: { ...getEdit(suggestion), ...patch },
    }));
  }

  async function handleImageSelect(suggestion: ProductSuggestionWithTenant, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setImageUploadPendingId(suggestion.id);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`/api/admin/product-suggestions/${suggestion.id}/upload-image`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Görsel yüklenemedi.");
        return;
      }

      updateEdit(suggestion, { imageUrl: result.imageUrl });
    } catch {
      setError("Görsel yüklenemedi.");
    } finally {
      setImageUploadPendingId(null);
    }
  }

  function approve(suggestion: ProductSuggestionWithTenant) {
    const categoryName = categoryByRow[suggestion.id] ?? CATEGORY_OPTIONS[0];
    const edit = getEdit(suggestion);
    setError(null);
    setPendingId(suggestion.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/product-suggestions/${suggestion.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: categoryName,
          product_name: edit.productName.trim() || undefined,
          barcode: edit.barcode.trim() || undefined,
          price: edit.price.trim() === "" ? null : Number(edit.price),
          image_url: edit.imageUrl,
        }),
      });
      const result = await response.json();

      setPendingId(null);
      if (!response.ok) {
        setError(result.error ?? "Onaylanamadı.");
        return;
      }

      setSuggestions((current) => current.filter((entry) => entry.id !== suggestion.id));
      router.refresh();
    });
  }

  function reject(suggestion: ProductSuggestionWithTenant) {
    setError(null);
    setPendingId(suggestion.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/product-suggestions/${suggestion.id}/reject`, {
        method: "POST",
      });
      const result = await response.json();

      setPendingId(null);
      if (!response.ok) {
        setError(result.error ?? "Reddedilemedi.");
        return;
      }

      setSuggestions((current) => current.filter((entry) => entry.id !== suggestion.id));
      router.refresh();
    });
  }

  if (!suggestions.length) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        Onay bekleyen ürün önerisi yok.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />

      {suggestions.map((suggestion) => {
        const isExpanded = expandedId === suggestion.id;
        const isPending = pendingId === suggestion.id;
        const isUploadingImage = imageUploadPendingId === suggestion.id;
        const edit = getEdit(suggestion);

        return (
          <Card key={suggestion.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{suggestion.product_name}</p>
                  <Badge className="bg-slate-100 text-slate-700">{suggestion.tenant_company_name}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Barkod: {suggestion.barcode} • Önerilen fiyat:{" "}
                  {typeof suggestion.price === "number" ? formatCurrency(suggestion.price) : "belirtilmedi"} •{" "}
                  {formatDate(suggestion.created_at)}
                </p>
              </div>
            </div>

            {isExpanded ? (
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={edit.productName}
                    onChange={(event) => updateEdit(suggestion, { productName: event.target.value })}
                    placeholder="Ürün adı"
                    className="min-w-[220px] flex-1"
                  />
                  <Input
                    value={edit.barcode}
                    onChange={(event) => updateEdit(suggestion, { barcode: event.target.value })}
                    placeholder="Barkod / SKU"
                    className="w-40"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={edit.price}
                    onChange={(event) => updateEdit(suggestion, { price: event.target.value })}
                    placeholder="Fiyat"
                    className="w-28"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {edit.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- küçük önizleme, next/image optimizasyonuna gerek yok
                      <img src={edit.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="px-1 text-center text-[9px] leading-tight text-slate-400">Görsel yok</span>
                    )}
                  </div>
                  <input
                    id={`suggestion-image-${suggestion.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageSelect(suggestion, event)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById(`suggestion-image-${suggestion.id}`)?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? "Yükleniyor..." : edit.imageUrl ? "Görseli değiştir" : "Görsel seç"}
                  </Button>
                  {edit.imageUrl ? (
                    <Button type="button" variant="secondary" onClick={() => updateEdit(suggestion, { imageUrl: null })}>
                      Kaldır
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={categoryByRow[suggestion.id] ?? CATEGORY_OPTIONS[0]}
                    onChange={(event) =>
                      setCategoryByRow((current) => ({ ...current, [suggestion.id]: event.target.value }))
                    }
                    className="max-w-xs"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                  <Button onClick={() => approve(suggestion)} disabled={isPending}>
                    {isPending ? "Ekleniyor..." : "Onayla ve ekle"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setExpandedId(null)} disabled={isPending}>
                    Vazgeç
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => setExpandedId(suggestion.id)} disabled={isPending}>
                  Onayla
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => reject(suggestion)}
                  disabled={isPending}
                >
                  {isPending ? "İşleniyor..." : "Reddet"}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
