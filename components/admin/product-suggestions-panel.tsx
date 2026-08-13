"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Select } from "@/components/ui/select";
import { MARKET_CATEGORY_ANCESTORS } from "@/lib/market-catalog/category-taxonomy";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProductSuggestionWithTenant } from "@/lib/types";

const CATEGORY_OPTIONS = Object.keys(MARKET_CATEGORY_ANCESTORS).sort((a, b) =>
  a.localeCompare(b, "tr-TR"),
);

export function ProductSuggestionsPanel({
  initialSuggestions,
}: {
  initialSuggestions: ProductSuggestionWithTenant[];
}) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryByRow, setCategoryByRow] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function approve(suggestion: ProductSuggestionWithTenant) {
    const categoryName = categoryByRow[suggestion.id] ?? CATEGORY_OPTIONS[0];
    setError(null);
    setPendingId(suggestion.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/product-suggestions/${suggestion.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_name: categoryName }),
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
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
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
