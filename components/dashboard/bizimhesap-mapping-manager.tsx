"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Link2, Loader2, RefreshCw, Search, Sparkles, Unlink, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildBizimHesapIndex,
  matchKey,
  suggestMatches,
  type BizimHesapProduct,
} from "@/lib/integrations/bizimhesap-matching";
import { cn } from "@/lib/utils";

// Ürünler > BizimHesap Eşleştirme (8 Eki 2026, Lucatech). Her eKatalox ürünü /
// varyantı için BizimHesap stok kartı seçilir; siparişte o kart gider.

type BhOption = { id: string; code: string | null; barcode: string | null; title: string; variantName: string | null; label: string };

type MappingItem = {
  kind: "product" | "variant";
  id: string;
  productId: string;
  code: string | null;
  name: string;
  imageUrl: string | null;
  variantName: string | null;
  mappedId: string | null;
  mappedLabel: string | null;
  inheritedLabel: string | null;
  suggestion: { id: string; label: string } | null;
  cardMissing: boolean;
  codeMissing: boolean;
  sharedWith: string[];
};

type Filter = "problem" | "all" | "unmatched" | "suggested" | "matched";

const PAGE_SIZE = 50;

function isMatched(item: MappingItem) {
  return (Boolean(item.mappedId) && !item.cardMissing) || Boolean(item.inheritedLabel);
}

/** Silinmiş karta bağlı ya da aynı kartı farklı bir ürünle paylaşan satır. */
function isProblem(item: MappingItem) {
  return item.cardMissing || item.sharedWith.length > 0;
}

export function BizimHesapMappingManager() {
  const [bhProducts, setBhProducts] = useState<BhOption[]>([]);
  const [items, setItems] = useState<MappingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("unmatched");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cardStats, setCardStats] = useState<{ mappedCards: number; codedCards: number } | null>(null);

  async function load() {
    setError(null);
    try {
      const response = await fetch("/api/tenant/integrations/bizimhesap/mapping", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Liste alınamadı.");
      setBhProducts(json.bhProducts as BhOption[]);
      const loaded = json.items as MappingItem[];
      setItems(loaded);
      setCardStats(json.cardStats ?? null);
      // Sorun varsa sayfa "Sorunlu" filtresiyle açılır (ilk yüklemede).
      setFilter((current) => (current === "unmatched" && loaded.some(isProblem) ? "problem" : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liste alınamadı.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const index = useMemo(
    () =>
      buildBizimHesapIndex(
        bhProducts.map((p): BizimHesapProduct => ({ ...p, price: null, currency: null, isActive: true })),
      ),
    [bhProducts],
  );
  const labelById = useMemo(() => new Map(bhProducts.map((p) => [p.id, p.label])), [bhProducts]);

  const stats = useMemo(() => {
    const list = items ?? [];
    const matched = list.filter(isMatched).length;
    const suggested = list.filter((item) => !isMatched(item) && item.suggestion).length;
    const problem = list.filter(isProblem).length;
    return { total: list.length, matched, suggested, unmatched: list.length - matched, problem };
  }, [items]);

  const visible = useMemo(() => {
    const q = matchKey(query);
    return (items ?? []).filter((item) => {
      if (filter === "problem" && !isProblem(item)) return false;
      if (filter === "matched" && !isMatched(item)) return false;
      if (filter === "unmatched" && isMatched(item)) return false;
      if (filter === "suggested" && (isMatched(item) || !item.suggestion)) return false;
      if (!q) return true;
      return matchKey(`${item.code ?? ""} ${item.name} ${item.variantName ?? ""} ${item.mappedLabel ?? ""}`).includes(q);
    });
  }, [items, filter, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function setMapping(item: MappingItem, bizimhesapProductId: string | null) {
    const key = `${item.kind}:${item.id}`;
    setBusyRow(key);
    setNotice(null);
    try {
      const response = await fetch("/api/tenant/integrations/bizimhesap/mapping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: item.kind, id: item.id, bizimhesapProductId }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? "Kaydedilemedi.");
      setItems((current) =>
        (current ?? []).map((row) => {
          if (row.kind === item.kind && row.id === item.id) {
            return {
              ...row,
              mappedId: bizimhesapProductId,
              mappedLabel: bizimhesapProductId ? (labelById.get(bizimhesapProductId) ?? bizimhesapProductId) : null,
              suggestion: bizimhesapProductId ? null : row.suggestion,
            };
          }
          // Ürün düzeyi eşleşme değişince o ürünün varyantlarındaki "Üründen" bilgisi de değişir.
          if (item.kind === "product" && row.kind === "variant" && row.productId === item.productId) {
            return { ...row, inheritedLabel: bizimhesapProductId ? (labelById.get(bizimhesapProductId) ?? null) : null };
          }
          return row;
        }),
      );
      setOpenRow(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setBusyRow(null);
    }
  }

  // Liste her zaman BizimHesap'tan canlı gelir; yeni açılan ürünler için tekrar çeker.
  async function refreshFromBizimHesap() {
    setRefreshing(true);
    setNotice(null);
    await load();
    setRefreshing(false);
    setNotice("BizimHesap ürün listesi güncellendi.");
  }

  async function applySuggestions() {
    setBulkBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/tenant/integrations/bizimhesap/mapping", { method: "POST" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Uygulanamadı.");
      setNotice(`${json.applied} ürün otomatik eşleştirildi.`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Uygulanamadı.");
    } finally {
      setBulkBusy(false);
    }
  }

  if (error) {
    return (
      <Card className="flex items-start gap-3 border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-2 font-medium underline">
            Tekrar dene
          </button>
        </div>
      </Card>
    );
  }

  if (!items) {
    return (
      <Card className="flex items-center gap-3 p-6 text-sm text-slate-600">
        <Loader2 className="size-4 animate-spin" /> BizimHesap ürünleri yükleniyor…
      </Card>
    );
  }

  const percent = stats.total ? Math.round((stats.matched / stats.total) * 100) : 0;
  const filters: Array<{ key: Filter; label: string; count: number }> = [
    ...(stats.problem ? [{ key: "problem" as const, label: "Sorunlu", count: stats.problem }] : []),
    { key: "unmatched", label: "Eşleşmeyen", count: stats.unmatched },
    { key: "suggested", label: "Önerisi olan", count: stats.suggested },
    { key: "matched", label: "Eşleşen", count: stats.matched },
    { key: "all", label: "Tümü", count: stats.total },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Eşleşme durumu</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.matched} / {stats.total} <span className="text-base font-medium text-slate-500">eşleşti</span>
            </p>
            {cardStats ? (
              <p className={cn("mt-1 text-xs font-medium", cardStats.codedCards < cardStats.mappedCards ? "text-amber-700" : "text-emerald-700")}>
                Eşlenen {cardStats.mappedCards} BizimHesap kartının {cardStats.codedCards} tanesinde Ürün Kodu ya da Barkodu dolu.
                {cardStats.codedCards < cardStats.mappedCards
                  ? " BizimHesap ürünü kod/barkoddan tanır; ikisi de boş kartlara sipariş gönderilmez."
                  : ""}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              BizimHesap&apos;ta {bhProducts.length} aktif ürün bulundu.
              {stats.unmatched ? " Eşleşmeyen ürün içeren sipariş BizimHesap'a gönderilmez." : " Tüm ürünler hazır."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void refreshFromBizimHesap()} disabled={refreshing || bulkBusy}>
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            BizimHesap&apos;tan yenile
          </Button>
          {stats.suggested ? (
            <Button onClick={() => void applySuggestions()} disabled={bulkBusy}>
              {bulkBusy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {stats.suggested} öneriyi uygula
            </Button>
          ) : null}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
        {notice ? <p className="mt-3 text-sm text-slate-700">{notice}</p> : null}
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                setFilter(entry.key);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                filter === entry.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {entry.label} <span className="opacity-70">{entry.count}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Model kodu ya da ürün adı"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="divide-y divide-slate-100 overflow-hidden">
        {pageItems.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            {filter === "unmatched" && !query ? "Eşleşmeyen ürün kalmadı." : "Bu filtrede ürün yok."}
          </p>
        ) : null}
        {pageItems.map((item) => {
          const key = `${item.kind}:${item.id}`;
          return (
            <MappingRow
              key={key}
              item={item}
              open={openRow === key}
              busy={busyRow === key}
              index={index}
              bhProducts={bhProducts}
              onToggle={() => setOpenRow((current) => (current === key ? null : key))}
              onSelect={(id) => void setMapping(item, id)}
            />
          );
        })}
      </Card>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {visible.length} satırdan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Önceki
            </Button>
            <Button variant="secondary" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MappingRow({
  item,
  open,
  busy,
  index,
  bhProducts,
  onToggle,
  onSelect,
}: {
  item: MappingItem;
  open: boolean;
  busy: boolean;
  index: ReturnType<typeof buildBizimHesapIndex>;
  bhProducts: BhOption[];
  onToggle: () => void;
  onSelect: (id: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const candidates = useMemo(() => {
    if (!open) return [];
    const q = matchKey(search);
    if (q) {
      return bhProducts
        .filter((p) => matchKey(`${p.code ?? ""} ${p.title} ${p.variantName ?? ""} ${p.barcode ?? ""}`).includes(q))
        .slice(0, 12);
    }
    const byId = new Map(bhProducts.map((p) => [p.id, p]));
    return suggestMatches(index, { code: item.code, name: item.name, variantName: item.variantName }, 8)
      .map((p) => byId.get(p.id))
      .filter((p): p is BhOption => Boolean(p));
  }, [open, search, bhProducts, index, item.code, item.name, item.variantName]);

  return (
    <div className={cn("p-4", open && "bg-slate-50/70")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {item.imageUrl ? (
              // Küçük önizleme; next/image optimizasyonu gereksiz.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="size-full object-contain p-0.5" loading="lazy" />
            ) : null}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              <span className="font-mono">{item.code ?? "—"}</span>
              {item.variantName ? (
                <span className="ml-2 rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                  {item.variantName}
                </span>
              ) : null}
            </p>
            <p className="truncate text-xs text-slate-500">{item.name}</p>
            {item.sharedWith.length ? (
              <p className="mt-0.5 text-xs font-medium text-amber-700">
                Bu BizimHesap kartı şunlara da bağlı: {item.sharedWith.slice(0, 3).join(", ")}
                {item.sharedWith.length > 3 ? "…" : ""}. Doğru mu kontrol edin.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 md:w-[46%] md:justify-end">
          {item.mappedId && item.cardMissing ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
                <CircleAlert className="size-3.5" /> Eşleştiği kart BizimHesap&apos;ta silinmiş
              </span>
              <Button onClick={onToggle} disabled={busy}>
                <Link2 className="size-4" /> Yeniden seç
              </Button>
            </>
          ) : item.mappedId ? (
            <>
              {item.codeMissing ? (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600" title="BizimHesap kartının Ürün Kodu ve Barkodu boş">
                  Kod yok
                </span>
              ) : null}
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span className="truncate">{item.mappedLabel}</span>
              </span>
              <Button variant="secondary" onClick={onToggle} disabled={busy}>
                Değiştir
              </Button>
              <button
                type="button"
                onClick={() => onSelect(null)}
                disabled={busy}
                title="Eşleşmeyi kaldır"
                className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Unlink className="size-4" />
              </button>
            </>
          ) : item.suggestion ? (
            <>
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
                <Sparkles className="size-3.5 shrink-0" />
                <span className="truncate">Öneri: {item.suggestion.label}</span>
              </span>
              <Button onClick={() => onSelect(item.suggestion!.id)} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Kabul et
              </Button>
              <Button variant="secondary" onClick={onToggle} disabled={busy}>
                Başka seç
              </Button>
            </>
          ) : (
            <>
              {item.inheritedLabel ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                  <span className="truncate">Üründen: {item.inheritedLabel}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
                  <CircleAlert className="size-3.5" /> Eşleşmedi
                </span>
              )}
              <Button onClick={onToggle} disabled={busy}>
                <Link2 className="size-4" /> BizimHesap ürünü seç
              </Button>
            </>
          )}
        </div>
      </div>

      {open ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="BizimHesap'ta ara: kod, ad ya da barkod"
                className="pl-9"
              />
            </div>
            <button type="button" onClick={onToggle} className="rounded-md p-2 text-slate-400 hover:bg-slate-100" aria-label="Kapat">
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{search ? "Arama sonuçları" : "En yakın BizimHesap ürünleri"}</p>
          <ul className="mt-1.5 max-h-72 space-y-1 overflow-y-auto">
            {candidates.length === 0 ? (
              <li className="px-2 py-3 text-sm text-slate-500">Sonuç yok; farklı bir kelime deneyin.</li>
            ) : null}
            {candidates.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => onSelect(option.id)}
                  disabled={busy}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100",
                    option.id === item.mappedId && "bg-emerald-50",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">
                      {option.title}
                      {option.variantName ? <span className="text-slate-500"> · {option.variantName}</span> : null}
                    </span>
                    <span className="block truncate font-mono text-xs text-slate-500">
                      {[option.code, option.barcode].filter(Boolean).join(" · ") || "kodsuz"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary">Seç</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
