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
}: {
  priceLists: PriceList[];
  values: Record<string, string>;
  onChange: (priceListId: string, value: string) => void;
  discountValues?: Record<string, string>;
  onDiscountChange?: (priceListId: string, value: string) => void;
  showDiscounts?: boolean;
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

        return (
          <div key={list.id} className="grid gap-2 text-sm text-slate-700">
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
          </div>
        );
      })}
    </div>
  );
}
