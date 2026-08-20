"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  buildSuggestionProductHref,
  dismissSuggestionNotice,
} from "@/lib/products/suggestion-notice-actions";
import type { ProductSuggestion } from "@/lib/types";

// Ürünler sayfasının üstündeki onay bildirimi. Bildirim zilindekiyle AYNI
// kurala tabi: bir bildirim yalnızca kullanıcı o ürüne tıkladığında okundu
// sayılır. Sağdaki X sunucuda hiçbir şey silmez, sadece banner'ı bu sayfa
// görüntüsü için gizler — tıklanmamış bildirim zilde durmaya devam eder.
export function ProductSuggestionNotice({ suggestions }: { suggestions: ProductSuggestion[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const items = suggestions.filter((suggestion) => !dismissedIds.includes(suggestion.id));

  if (hidden || !items.length) {
    return null;
  }

  async function openProduct(notice: ProductSuggestion) {
    if (pendingId) {
      return;
    }

    setPendingId(notice.id);
    setDismissedIds((current) => [...current, notice.id]);

    // Sıra bildirim zilindekiyle aynı: önce okundu yazılır, sonra
    // router.refresh() menüdeki kırmızı rozeti taşıyan layout'u yeniden
    // render eder, en son ürüne gidilir.
    await dismissSuggestionNotice(notice.id);
    router.refresh();
    setPendingId(null);
    router.push(buildSuggestionProductHref(notice));
  }

  return (
    <Card className="flex items-start justify-between gap-3 border-emerald-200 bg-emerald-50 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            Önerdiğiniz {items.length} ürün onaylandı ve eklendi
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Ürünler stoğu kapalı olarak eklendi. Stok açmak için ürüne tıklayın.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                disabled={pendingId !== null}
                onClick={() => void openProduct(suggestion)}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-60"
              >
                {pendingId === suggestion.id
                  ? "Açılıyor…"
                  : `${suggestion.product_name} →`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Bildirimi gizle"
        title="Gizle (bildirimler silinmez)"
        className="shrink-0 rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
      >
        <X className="size-4" />
      </button>
    </Card>
  );
}
