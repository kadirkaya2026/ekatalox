"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import { buildVariantListPriceFormState } from "@/lib/products/price-form";
import { sanitizePrice } from "@/lib/products/parse-price-input";
import type { PriceList, Product, ProductVariant } from "@/lib/types";

interface VariantMatrixRow {
  id?: string;
  model_name: string;
  package_quantity: string;
  carton_quantity: string;
  listPrices: Record<string, string>;
  is_available_for_sale: boolean;
  display_order: number;
}

function emptyVariantRow(display_order: number, priceLists: PriceList[]): VariantMatrixRow {
  return {
    model_name: "",
    package_quantity: "",
    carton_quantity: "",
    listPrices: buildVariantListPriceFormState(priceLists),
    is_available_for_sale: true,
    display_order,
  };
}

function variantToMatrixRow(
  variant: ProductVariant,
  index: number,
  priceLists: PriceList[],
): VariantMatrixRow {
  return {
    id: variant.id,
    model_name: variant.model_name,
    package_quantity: variant.package_quantity ? String(variant.package_quantity) : "",
    carton_quantity: variant.carton_quantity ? String(variant.carton_quantity) : "",
    listPrices: buildVariantListPriceFormState(priceLists, variant),
    is_available_for_sale: variant.is_available_for_sale,
    display_order: variant.display_order || index + 1,
  };
}

function normalizeVariantRows(rows: VariantMatrixRow[]) {
  return rows.map((row, index) => ({
    id: row.id ?? "",
    model_name: row.model_name.trim(),
    package_quantity: row.package_quantity.trim() ? Number(row.package_quantity) : null,
    carton_quantity: row.carton_quantity.trim() ? Number(row.carton_quantity) : null,
    is_available_for_sale: row.is_available_for_sale,
    display_order: index + 1,
    prices: Object.entries(row.listPrices)
      .filter(([, value]) => value.trim() !== "")
      .map(([price_list_id, price]) => ({
        price_list_id,
        // "19,90" gibi Türkçe ondalık da kabul edilir; Number("19,90") NaN
        // veriyordu ve fiyat sessizce kayboluyordu (2 Eyl 2026).
        price: sanitizePrice(price),
      })),
  }));
}

export function ProductVariantMatrixModal({
  product,
  priceLists,
  pricedLists,
  onClose,
  onSaved,
}: {
  product: Product;
  priceLists: PriceList[];
  pricedLists: PriceList[];
  onClose: () => void;
  onSaved: (updated: Product) => void;
}) {
  const [variantRows, setVariantRows] = useState<VariantMatrixRow[]>(() =>
    (product.variants ?? []).length
      ? (product.variants ?? []).map((variant, index) =>
          variantToMatrixRow(variant, index, priceLists),
        )
      : [emptyVariantRow(1, priceLists)],
  );
  const [variantMessage, setVariantMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateVariantRow(
    index: number,
    key: keyof VariantMatrixRow,
    value: VariantMatrixRow[keyof VariantMatrixRow],
  ) {
    setVariantRows((current) =>
      current.map((row, rowIndex) => (rowIndex !== index ? row : { ...row, [key]: value })),
    );
  }

  function updateVariantRowPrice(index: number, priceListId: string, value: string) {
    setVariantRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex !== index
          ? row
          : { ...row, listPrices: { ...row.listPrices, [priceListId]: value } },
      ),
    );
  }

  function addVariantRow() {
    setVariantRows((current) => [...current, emptyVariantRow(current.length + 1, priceLists)]);
  }

  function removeVariantRow(index: number) {
    setVariantRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, display_order: rowIndex + 1 }));
    });
  }

  function handleSave() {
    const hasEmptyModelName = variantRows.some((row) => !row.model_name.trim());

    if (hasEmptyModelName) {
      setVariantMessage("Her satır için model adı zorunludur.");
      return;
    }

    setVariantMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tenant/products/${product.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: normalizeVariantRows(variantRows) }),
      });

      const result = await response.json();

      if (!response.ok) {
        setVariantMessage(result.error ?? "Varyantlar kaydedilemedi. Migration uygulanmamış olabilir.");
        return;
      }

      onSaved(result.product as Product);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${product.product_name} • Model Matrisi`}
      panelClassName="max-w-6xl sm:max-h-[min(92dvh,100%)]"
      bodyClassName="sm:p-6"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Hızlı varyant düzenleyici</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Model adı, paket içi, koli içi, fiyat ve satış durumunu tek ekranda yönetin. Fiyat
              boş bırakılırsa ürün fiyatı kullanılır.
            </p>
          </div>
          <Button variant="secondary" onClick={addVariantRow}>
            <Plus className="size-4" />
            Satır Ekle
          </Button>
        </div>

        {variantMessage ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {variantMessage}
          </div>
        ) : null}

        <div className="max-h-[min(52vh,32rem)] overflow-auto rounded-xl border border-border">
          <table className="min-w-full border-collapse">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Model Adı</th>
                <th className="px-3 py-3">Paket İçi</th>
                <th className="px-3 py-3">Koli İçi</th>
                {pricedLists.map((list) => (
                  <th key={list.id} className="px-3 py-3 whitespace-nowrap">
                    {getPriceListDisplayName(list)}
                  </th>
                ))}
                <th className="px-3 py-3">Satış Durumu</th>
                <th className="px-3 py-3 text-right">Sil</th>
              </tr>
            </thead>
            <tbody>
              {variantRows.map((row, index) => (
                <tr key={row.id ?? `variant-row-${index}`} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Input
                      value={row.model_name}
                      onChange={(event) => updateVariantRow(index, "model_name", event.target.value)}
                      placeholder="Örn: Siyah"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={row.package_quantity}
                      onChange={(event) =>
                        updateVariantRow(index, "package_quantity", event.target.value)
                      }
                      placeholder="Boş bırak"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={row.carton_quantity}
                      onChange={(event) =>
                        updateVariantRow(index, "carton_quantity", event.target.value)
                      }
                      placeholder="Boş bırak"
                    />
                  </td>
                  {pricedLists.map((list) => (
                    <td key={list.id} className="px-3 py-3">
                      <Input
                        inputMode="decimal"
                        value={row.listPrices[list.id] ?? ""}
                        onChange={(event) =>
                          updateVariantRowPrice(index, list.id, event.target.value)
                        }
                        placeholder="Ürün fiyatı"
                        className="min-w-[6.5rem]"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <label className="flex items-center gap-3 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={row.is_available_for_sale}
                        onChange={(event) =>
                          updateVariantRow(index, "is_available_for_sale", event.target.checked)
                        }
                      />
                      <span>{row.is_available_for_sale ? "Satışta" : "Kapalı"}</span>
                    </label>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      variant="secondary"
                      className="h-9 border-red-200 px-3 text-red-700 hover:bg-red-50"
                      onClick={() => removeVariantRow(index)}
                      disabled={variantRows.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            Toplu Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
