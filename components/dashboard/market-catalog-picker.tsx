"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MarketCatalogProduct } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface Usage {
  total: number;
  limit: number;
  remaining: number;
}

export function MarketCatalogPicker({
  catalog,
  importedSkuCodes,
  usage,
}: {
  catalog: MarketCatalogProduct[];
  importedSkuCodes: string[];
  usage: Usage;
}) {
  const router = useRouter();
  const imported = useMemo(() => new Set(importedSkuCodes), [importedSkuCodes]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "importing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr-TR");
    if (!term) return catalog;
    return catalog.filter(
      (item) =>
        item.product_name.toLocaleLowerCase("tr-TR").includes(term) ||
        item.category_name.toLocaleLowerCase("tr-TR").includes(term) ||
        (item.brand ?? "").toLocaleLowerCase("tr-TR").includes(term),
    );
  }, [catalog, search]);

  const selectableFiltered = filtered.filter((item) => !imported.has(item.sku_code));
  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((item) => selected.has(item.sku_code));

  function toggle(skuCode: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(skuCode)) {
        next.delete(skuCode);
      } else {
        next.add(skuCode);
      }
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const item of selectableFiltered) next.delete(item.sku_code);
      } else {
        for (const item of selectableFiltered) next.add(item.sku_code);
      }
      return next;
    });
  }

  async function handleImport() {
    if (!selected.size) return;

    setStatus("importing");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/tenant/products/import-from-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku_codes: [...selected] }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Ürünler aktarılamadı.");
      }

      setSuccessMessage(`${body.importedCount} ürün mağazanıza aktarıldı.`);
      setSelected(new Set());
      setStatus("idle");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Ürünler aktarılamadı.");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün, kategori veya marka ara..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>
            Ürün limiti: <strong>{usage.total}</strong> / {usage.limit}{" "}
            <span className="text-slate-400">({usage.remaining} kaldı)</span>
          </span>
          <Button
            variant="secondary"
            onClick={toggleAllFiltered}
            disabled={!selectableFiltered.length}
          >
            {allFilteredSelected ? "Seçimi Kaldır" : "Listelenenleri Seç"}
          </Button>
          <Button onClick={handleImport} disabled={!selected.size || status === "importing"}>
            {status === "importing" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {selected.size} Ürünü Aktar
          </Button>
        </div>
      </Card>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Marka</th>
                <th className="px-4 py-3">Referans Fiyat</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isImported = imported.has(item.sku_code);
                const isSelected = selected.has(item.sku_code);
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition",
                      isImported ? "opacity-50" : "cursor-pointer hover:bg-emerald-50/50",
                    )}
                    onClick={() => !isImported && toggle(item.sku_code)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isImported}
                        onChange={() => toggle(item.sku_code)}
                        className="size-4 accent-emerald-600"
                      />
                    </td>
                    <td className="flex items-center gap-3 px-4 py-3">
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="size-10 shrink-0 rounded-lg border border-slate-100 object-cover"
                      />
                      <span className="font-medium text-slate-900">{item.product_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.category_name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.brand ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {typeof item.reference_price === "number"
                        ? formatCurrency(item.reference_price)
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {isImported ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          Zaten eklendi
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Aktarılabilir
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Aramanızla eşleşen ürün bulunamadı.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
