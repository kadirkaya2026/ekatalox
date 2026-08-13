"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MarketCatalogProduct } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 50;

interface Usage {
  total: number;
  limit: number;
  remaining: number;
}

export function MarketCatalogPicker({
  initialCatalog,
  initialTotal,
  importedSkuCodes,
  usage,
}: {
  initialCatalog: MarketCatalogProduct[];
  initialTotal: number;
  importedSkuCodes: string[];
  usage: Usage;
}) {
  const router = useRouter();
  const imported = new Set(importedSkuCodes);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "importing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const requestId = useRef(0);
  const isFirstRender = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Arama kutusuna yazılan terim, o an ekrandaki sayfayla sınırlı kalmadan
  // sunucuda TÜM katalogda aranır — kullanıcı 51. sayfadaki bir ürünü de
  // yazarak bulabilir.
  async function fetchPage(nextPage: number, nextSearch: string) {
    const thisRequest = ++requestId.current;
    setIsFetching(true);

    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (nextSearch.trim()) {
        params.set("q", nextSearch.trim());
      }

      const response = await fetch(`/api/tenant/products/market-catalog?${params}`);
      const body = await response.json();

      if (thisRequest !== requestId.current) {
        return;
      }

      if (!response.ok) {
        setErrorMessage(body.error ?? "Katalog yüklenemedi.");
        return;
      }

      setCatalog(body.products as MarketCatalogProduct[]);
      setTotal(body.total as number);
      setPage(nextPage);
    } catch {
      if (thisRequest === requestId.current) {
        setErrorMessage("Katalog yüklenemedi.");
      }
    } finally {
      if (thisRequest === requestId.current) {
        setIsFetching(false);
      }
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      void fetchPage(1, search);
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectableOnPage = catalog.filter((item) => !imported.has(item.sku_code));
  const allOnPageSelected =
    selectableOnPage.length > 0 &&
    selectableOnPage.every((item) => selected.has(item.sku_code));

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

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const item of selectableOnPage) next.delete(item.sku_code);
      } else {
        for (const item of selectableOnPage) next.add(item.sku_code);
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
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span>
            Ürün limiti: <strong>{usage.total}</strong> / {usage.limit}{" "}
            <span className="text-slate-400">({usage.remaining} kaldı)</span>
          </span>
          <Button
            variant="secondary"
            onClick={toggleAllOnPage}
            disabled={!selectableOnPage.length}
          >
            {allOnPageSelected ? "Seçimi Kaldır" : "Listelenenleri Seç"}
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
        <div className={cn("relative max-h-[70vh] overflow-y-auto", isFetching && "opacity-60")}>
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
              {catalog.map((item) => {
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
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="size-10 shrink-0 rounded-lg border border-slate-100 object-cover"
                        />
                      ) : (
                        <div className="size-10 shrink-0 rounded-lg border border-slate-100 bg-slate-50" />
                      )}
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
              {!catalog.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    {isFetching ? "Yükleniyor..." : "Aramanızla eşleşen ürün bulunamadı."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Toplam <strong>{total}</strong> üründen {catalog.length ? (page - 1) * PAGE_SIZE + 1 : 0}
            –{(page - 1) * PAGE_SIZE + catalog.length} arası gösteriliyor
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fetchPage(page - 1, search)}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="size-4" />
              Önceki
            </Button>
            <span className="text-slate-500">
              Sayfa {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fetchPage(page + 1, search)}
              disabled={page >= totalPages || isFetching}
            >
              Sonraki
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
