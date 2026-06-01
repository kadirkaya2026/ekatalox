import { Input } from "@/components/ui/input";
import type { PriceList } from "@/lib/types";

export function ProductPriceFields({
  priceLists,
  values,
  onChange,
}: {
  priceLists: PriceList[];
  values: Record<string, string>;
  onChange: (priceListId: string, value: string) => void;
}) {
  const pricedLists = priceLists.filter((list) => !list.is_catalog_only);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pricedLists.map((list) => (
        <label key={list.id} className="grid gap-2 text-sm text-slate-700">
          <span className="font-medium">{list.name}</span>
          <Input
            inputMode="decimal"
            placeholder="0"
            value={values[list.id] ?? ""}
            onChange={(event) => onChange(list.id, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
