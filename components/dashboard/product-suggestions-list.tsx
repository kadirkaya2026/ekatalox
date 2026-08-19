import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ProductSuggestion } from "@/lib/types";

// "rejected" durumu burada yok — reddedilen öneriler tenant'a hiç
// görünmeden sessizce kaybolur (bkz. getTenantAllSuggestions).
const STATUS_META: Record<Exclude<ProductSuggestion["status"], "rejected">, { label: string; className: string }> = {
  pending: { label: "Bekliyor", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Oluşturuldu", className: "bg-emerald-100 text-emerald-700" },
};

export function ProductSuggestionsList({ suggestions }: { suggestions: ProductSuggestion[] }) {
  if (!suggestions.length) {
    return null;
  }

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">Önerdiğim Ürünler</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Listede bulamayıp eklenmesini önerdiğiniz ürünler ve süper adminin kararı.
      </p>
      <div className="mt-4 space-y-2">
        {suggestions
          .filter((suggestion) => suggestion.status !== "rejected")
          .map((suggestion) => {
          const meta = STATUS_META[suggestion.status as Exclude<ProductSuggestion["status"], "rejected">];
          return (
            <div
              key={suggestion.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{suggestion.product_name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Barkod: {suggestion.barcode} • {formatDate(suggestion.created_at)}
                </p>
              </div>
              <Badge className={meta.className}>{meta.label}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
