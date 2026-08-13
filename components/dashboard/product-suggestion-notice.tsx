"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProductSuggestion } from "@/lib/types";

export function ProductSuggestionNotice({ suggestions }: { suggestions: ProductSuggestion[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [pending, setPending] = useState(false);

  if (dismissed || !suggestions.length) {
    return null;
  }

  async function dismiss() {
    setPending(true);
    try {
      await fetch("/api/tenant/products/product-suggestions/dismiss", { method: "POST" });
    } finally {
      setDismissed(true);
      setPending(false);
    }
  }

  const names = suggestions.map((suggestion) => suggestion.product_name).join(", ");

  return (
    <Card className="flex items-start justify-between gap-3 border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Süper admin {suggestions.length} önerdiğiniz ürünü onayladı ve eklendi
          </p>
          <p className="mt-1 text-sm text-emerald-800">{names}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        disabled={pending}
        aria-label="Bildirimi kapat"
        className="shrink-0 rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
      >
        <X className="size-4" />
      </button>
    </Card>
  );
}
