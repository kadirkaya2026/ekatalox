import { EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import type { PriceList } from "@/lib/types";

// İndirim liste başına tanımlanır (kullanıcı isteği, 21 Ağu 2026): her
// listenin kendi indirimli fiyatı vardır, boş bırakılan listede indirim
// yoktur. Eskiden tek bir indirimli fiyat tüm listelere uygulanıyordu ve
// indirim girebilmek için TÜM listelere fiyat yazmak zorunluydu.
export function ProductPriceFields({
  priceLists,
  values,
  onChange,
  discountValues,
  onDiscountChange,
  showDiscounts = false,
  hiddenValues,
  onHiddenChange,
}: {
  priceLists: PriceList[];
  values: Record<string, string>;
  onChange: (priceListId: string, value: string) => void;
  discountValues?: Record<string, string>;
  onDiscountChange?: (priceListId: string, value: string) => void;
  showDiscounts?: boolean;
  // "Bu listede gizle" (0162): verilmezse anahtar gösterilmez.
  hiddenValues?: Record<string, boolean>;
  onHiddenChange?: (priceListId: string, hidden: boolean) => void;
}) {
  const pricedLists = priceLists.filter((list) => !list.is_catalog_only);
  const withDiscounts = showDiscounts && Boolean(onDiscountChange);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pricedLists.map((list) => {
        const listPrice = Number(String(values[list.id] ?? "").replace(",", "."));
        const discountRaw = String(discountValues?.[list.id] ?? "").trim();
        const discount = Number(discountRaw.replace(",", "."));
        const invalid =
          withDiscounts &&
          discountRaw !== "" &&
          Number.isFinite(discount) &&
          Number.isFinite(listPrice) &&
          listPrice > 0 &&
          discount >= listPrice;
        const hidden = Boolean(hiddenValues?.[list.id]);

        return (
          <div
            key={list.id}
            className={`grid gap-2 rounded-xl border p-3 text-sm text-slate-700 transition-colors ${
              hidden ? "border-amber-300 bg-amber-50/60" : "border-slate-200 bg-white"
            }`}
          >
            <label className="grid gap-2">
              <span className="font-medium">{getPriceListDisplayName(list)}</span>
              <Input
                inputMode="decimal"
                placeholder="0"
                value={values[list.id] ?? ""}
                onChange={(event) => onChange(list.id, event.target.value)}
              />
            </label>

            {withDiscounts ? (
              <label className="grid gap-1">
                <span className="text-xs text-slate-500">İndirimli fiyat (boş = indirim yok)</span>
                <Input
                  inputMode="decimal"
                  placeholder="—"
                  value={discountValues?.[list.id] ?? ""}
                  onChange={(event) => onDiscountChange!(list.id, event.target.value)}
                  className={invalid ? "border-rose-400" : undefined}
                />
                {invalid ? (
                  <span className="text-xs text-rose-600">
                    Liste fiyatından düşük olmalı.
                  </span>
                ) : null}
              </label>
            ) : null}

            {onHiddenChange ? (
              <div className="grid gap-1 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={hidden}
                  onClick={() => onHiddenChange(list.id, !hidden)}
                  className="flex items-center justify-between gap-3 text-left"
                >
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      hidden ? "text-amber-700" : "text-slate-500"
                    }`}
                  >
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                    Bu listede gizle
                  </span>
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                      hidden ? "bg-amber-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        hidden ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>
                {hidden ? (
                  <span className="text-xs text-amber-700">
                    Bu listeyi kullanan müşteriler ürünü görmez.
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
