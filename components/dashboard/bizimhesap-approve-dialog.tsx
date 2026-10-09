"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, Pencil, RefreshCw, Search, Sparkles, UserRound, Warehouse, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { matchKey } from "@/lib/integrations/bizimhesap-matching";
import { cn } from "@/lib/utils";

// Sipariş onayı + BizimHesap (0167, Lucatech): personel cariyi ve eşleşmeyen
// ürünleri burada seçer; listeler her açılışta BizimHesap'tan canlı gelir.

type Customer = { id: string; title: string; code: string | null; phone: string | null };
type BhProduct = { id: string; code: string | null; barcode: string | null; title: string; variantName: string | null; label: string };
type Line = {
  key: string;
  kind: "product" | "variant";
  id: string;
  code: string | null;
  name: string;
  variantName: string | null;
  quantity: number;
  isGift: boolean;
  imageUrl: string | null;
  mappedId: string | null;
  mappedLabel: string | null;
  mappedHasCode: boolean;
  missingMapped: boolean;
  suggestion: { id: string; label: string; hasCode: boolean } | null;
  /** Satırın BizimHesap deposu: siparişte seçilen ya da ürünün varsayılanı (null = BizimHesap varsayılanı). */
  warehouseId: string | null;
};
type Prepared = {
  warehouses: Array<{ id: string; title: string }>;
  customers: Customer[];
  products: BhProduct[];
  lines: Line[];
  selectedCustomerId: string | null;
  fallbackCustomerTitle: string | null;
  requireProductMatch: boolean;
  alreadySent: boolean;
};
type Choice = { id: string; label: string; source: "mapped" | "suggestion" | "picked"; hasCode: boolean };

export function BizimHesapApproveDialog({
  orderId,
  orderLabel,
  onClose,
  onApprove,
  onEdit,
}: {
  orderId: string;
  orderLabel: string;
  onClose: () => void;
  /** Seçimler kaydedildikten sonra siparişi Onaylandı'ya geçirir (gönderim sunucuda). */
  onApprove: () => Promise<void>;
  /** "Düzelt": pencereyi kapatıp siparişin fiş düzenleyicisini açar (adet, ürün ekle/çıkar). */
  onEdit?: () => void;
}) {
  const [data, setData] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [choices, setChoices] = useState<Record<string, Choice | null>>({});
  const [openLine, setOpenLine] = useState<string | null>(null);
  const [warehouseChoices, setWarehouseChoices] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tenant/orders/${orderId}/bizimhesap/prepare`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "BizimHesap bilgileri alınamadı.");
      const prepared = json as Prepared;
      setData(prepared);
      setCustomerId((current) => current ?? prepared.selectedCustomerId);
      setChoices((current) => {
        const next: Record<string, Choice | null> = {};
        for (const line of prepared.lines) {
          const kept = current[line.key];
          if (kept && kept.source === "picked") next[line.key] = kept;
          else if (line.mappedId && line.mappedLabel)
            next[line.key] = { id: line.mappedId, label: line.mappedLabel, source: "mapped", hasCode: line.mappedHasCode };
          else if (line.suggestion) next[line.key] = { ...line.suggestion, source: "suggestion" };
          else next[line.key] = null;
        }
        return next;
      });
      // Depo: kullanıcının bu pencerede değiştirdiği korunur, gerisi sunucudan.
      setWarehouseChoices((current) => {
        const next: Record<string, string> = {};
        for (const line of prepared.lines) next[line.key] = line.key in current ? current[line.key] : (line.warehouseId ?? "");
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "BizimHesap bilgileri alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const customers = useMemo(() => {
    const list = data?.customers ?? [];
    const q = matchKey(customerSearch);
    const filtered = q ? list.filter((c) => matchKey(`${c.title} ${c.code ?? ""} ${c.phone ?? ""}`).includes(q)) : list;
    return filtered.slice(0, 40);
  }, [data, customerSearch]);
  const selectedCustomer = data?.customers.find((c) => c.id === customerId) ?? null;

  const lines = data?.lines ?? [];
  const unmatched = lines.filter((line) => !choices[line.key]);
  // BizimHesap ürünü Ürün Kodu ile tanır: kodsuz karta giden satır yeni ürün açtırır.
  const codeless = lines.filter((line) => choices[line.key] && !choices[line.key]!.hasCode);
  const blocked = Boolean(data?.requireProductMatch) && (unmatched.length > 0 || codeless.length > 0);

  async function submit() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const changed = lines
        .map((line) => ({ line, choice: choices[line.key] }))
        .filter(({ line, choice }) => choice && choice.id !== line.mappedId)
        .map(({ line, choice }) => ({ kind: line.kind, id: line.id, bizimhesapProductId: choice!.id }));
      const response = await fetch(`/api/tenant/orders/${orderId}/bizimhesap/prepare`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, lines: changed, warehouses: warehouseChoices }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? "Kaydedilemedi.");
      await onApprove();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sipariş {orderLabel}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">Onayla ve BizimHesap&apos;a gönder</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              title="BizimHesap'taki carileri ve ürünleri yeniden çek"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Listeyi yenile
            </button>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Kapat">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {error ? (
          <p className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        ) : null}

        {!data ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-slate-600">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "BizimHesap carileri ve ürünleri yükleniyor…" : null}
          </div>
        ) : (
          <div className="space-y-6 px-5 py-5">
            {data.alreadySent ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bu sipariş daha önce BizimHesap&apos;a gönderilmiş; onaylamak yeniden göndermez.
              </p>
            ) : null}

            <section>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">1. BizimHesap carisi</h3>
                <span className="text-xs text-slate-500">{data.customers.length} cari</span>
              </div>
              {selectedCustomer ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-emerald-900">
                    <UserRound className="size-4 shrink-0" />
                    <span className="truncate font-semibold">{selectedCustomer.title}</span>
                    {selectedCustomer.phone ? <span className="truncate text-emerald-700">· {selectedCustomer.phone}</span> : null}
                  </span>
                  <button type="button" onClick={() => setCustomerId(null)} className="text-xs font-medium text-emerald-800 underline">
                    Değiştir
                  </button>
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-slate-200">
                  <div className="relative border-b border-slate-100">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      autoFocus
                      value={customerSearch}
                      onChange={(event) => setCustomerSearch(event.target.value)}
                      placeholder="Cari ara: unvan, kod ya da telefon"
                      className="border-0 pl-9 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <ul className="max-h-52 overflow-y-auto p-1">
                    {customers.length === 0 ? <li className="px-3 py-3 text-sm text-slate-500">Cari bulunamadı.</li> : null}
                    {customers.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerId(customer.id);
                            setCustomerSearch("");
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                        >
                          <span className="truncate font-medium text-slate-900">{customer.title}</span>
                          <span className="shrink-0 text-xs text-slate-500">{[customer.code, customer.phone].filter(Boolean).join(" · ")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                    {data.fallbackCustomerTitle
                      ? `Cari seçmezseniz taslak “${data.fallbackCustomerTitle}” carisine düşer.`
                      : "Cari seçmezseniz telefon/unvan eşleşmesine göre cari bulunur."}{" "}
                    Seçtiğiniz cari bu bayi için hatırlanır.
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">2. Ürünler</h3>
                <span className={cn("text-xs font-medium", unmatched.length || codeless.length ? "text-rose-600" : "text-emerald-700")}>
                  {lines.length - unmatched.length - codeless.length} / {lines.length} hazır
                </span>
              </div>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {lines.map((line) => {
                  const choice = choices[line.key];
                  return (
                    <li key={line.key} className="p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="size-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            {line.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={line.imageUrl} alt="" className="size-full object-contain p-0.5" loading="lazy" />
                            ) : null}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              <span className="font-mono">{line.code ?? "—"}</span>
                              {line.variantName ? (
                                <span className="ml-2 rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">{line.variantName}</span>
                              ) : null}
                              {line.isGift ? <span className="ml-2 text-xs font-medium text-amber-700">Hediye</span> : null}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {line.name} · {line.quantity} adet
                            </p>
                          </div>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 sm:max-w-[50%] sm:justify-end">
                          {choice && !choice.hasCode ? (
                            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700" title={choice.label}>
                              <CircleAlert className="size-3.5 shrink-0" />
                              <span className="truncate">Kartın Ürün Kodu/Barkodu boş: {choice.label}</span>
                            </span>
                          ) : choice ? (
                            <span
                              className={cn(
                                "inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                                choice.source === "suggestion" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800",
                              )}
                              title={choice.label}
                            >
                              {choice.source === "suggestion" ? <Sparkles className="size-3.5 shrink-0" /> : <CheckCircle2 className="size-3.5 shrink-0" />}
                              <span className="truncate">{choice.source === "suggestion" ? `Öneri: ${choice.label}` : choice.label}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
                              <CircleAlert className="size-3.5" /> {line.missingMapped ? "Eşleştiği kart silinmiş" : "Eşleşmedi"}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setOpenLine((current) => (current === line.key ? null : line.key))}
                            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {choice ? "Değiştir" : "Seç"}
                          </button>
                        </div>
                      </div>
                      {data.warehouses.length ? (
                        <label className="mt-2 flex items-center gap-2 text-xs text-slate-500 sm:pl-[3.25rem]">
                          <Warehouse className="size-3.5 shrink-0" />
                          <span className="shrink-0">Depo:</span>
                          <select
                            value={warehouseChoices[line.key] ?? ""}
                            onChange={(event) => setWarehouseChoices((current) => ({ ...current, [line.key]: event.target.value }))}
                            className={cn(
                              "h-8 min-w-0 max-w-[16rem] rounded-lg border bg-white px-2 text-xs",
                              warehouseChoices[line.key] ? "border-indigo-200 font-medium text-indigo-700" : "border-slate-200 text-slate-600",
                            )}
                          >
                            <option value="">Varsayılan depo</option>
                            {data.warehouses.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {openLine === line.key ? (
                        <ProductPicker
                          products={data.products}
                          line={line}
                          onPick={(product) => {
                            setChoices((current) => ({
                              ...current,
                              [line.key]: { id: product.id, label: product.label, source: "picked", hasCode: Boolean(product.code?.trim() || product.barcode?.trim()) },
                            }));
                            setOpenLine(null);
                          }}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {blocked ? (
                <p className="mt-2 text-xs text-rose-600">
                  {unmatched.length ? `Eşleşmeyen ${unmatched.length} ürün var. ` : ""}
                  {codeless.length ? `${codeless.length} satırın BizimHesap kartında Ürün Kodu ve Barkodu boş (BizimHesap ürünü bunlardan tanır). ` : ""}
                  BizimHesap&apos;ta yeni ürün açılmaması için bunlar düzelmeden gönderilemez.
                </p>
              ) : null}
            </section>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          {onEdit ? (
            <Button variant="secondary" onClick={onEdit} disabled={saving}>
              <Pencil className="size-4" />
              Düzelt
            </Button>
          ) : null}
          <Button onClick={() => void submit()} disabled={!data || saving || loading || blocked}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Onayla ve BizimHesap&apos;a gönder
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductPicker({ products, line, onPick }: { products: BhProduct[]; line: Line; onPick: (product: BhProduct) => void }) {
  const [search, setSearch] = useState(line.code ?? "");
  const results = useMemo(() => {
    const q = matchKey(search);
    const list = q
      ? products.filter((p) => matchKey(`${p.code ?? ""} ${p.title} ${p.variantName ?? ""} ${p.barcode ?? ""}`).includes(q))
      : products;
    return list.slice(0, 15);
  }, [products, search]);
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="BizimHesap ürünü ara: kod, ad ya da barkod"
          className="bg-white pl-9"
        />
      </div>
      <ul className="mt-1.5 max-h-56 space-y-0.5 overflow-y-auto">
        {results.length === 0 ? <li className="px-3 py-2 text-sm text-slate-500">Sonuç yok.</li> : null}
        {results.map((product) => (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => onPick(product)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-900">
                  {product.title}
                  {product.variantName ? <span className="text-slate-500"> · {product.variantName}</span> : null}
                </span>
                <span className="block truncate font-mono text-xs text-slate-500">
                  {[product.code, product.barcode].filter(Boolean).join(" · ") || "kodsuz"}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">Seç</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
