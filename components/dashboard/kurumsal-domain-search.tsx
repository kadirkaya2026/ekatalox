"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock, Loader2, Search, XCircle, HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DomainRequest } from "@/lib/kurumsal/domain-requests-shared";
import { formatUsd, type DomainSearchResult } from "@/lib/kurumsal/domain-search";
import { cn } from "@/lib/utils";

// "Yeni alan adı seç": arama kutusu → sonuç satırları (Boşta / Dolu /
// Kontrol edilemiyor) → seçim → talep (POST /api/tenant/kurumsal/domain/request).
// Talep varken bekleyen kart gösterilir (iptal edilebilir). Satın alma ve
// bağlama ekipçe yapılır; kurumsal_domain burada yazılmaz.

type SearchResponse = { results?: DomainSearchResult[]; warning?: string; error?: string };
type RequestResponse = { request?: DomainRequest | null; emailSent?: boolean; error?: string };

export function KurumsalDomainSearch({
  initialRequest,
  domainRequestHref,
  onRequestChange,
}: {
  initialRequest: DomainRequest | null;
  /** Destek WhatsApp bağlantısı (arama çalışmadığında alternatif) */
  domainRequestHref: string;
  onRequestChange?: (request: DomainRequest | null) => void;
}) {
  const [request, setRequest] = useState<DomainRequest | null>(initialRequest);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainSearchResult[] | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selected, setSelected] = useState<DomainSearchResult | null>(null);
  const [pending, setPending] = useState<null | "search" | "request" | "cancel">(null);
  const [error, setError] = useState<string | null>(null);
  const [emailNote, setEmailNote] = useState<string | null>(null);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setWarning(null);
    setSelected(null);
    if (!query.trim()) return setError("Aramak istediğiniz alan adını yazın. Örn: firmaniz");
    setPending("search");
    try {
      const res = await fetch("/api/tenant/kurumsal/domain/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query }),
      });
      const data = (await res.json().catch(() => null)) as SearchResponse | null;
      if (!res.ok) {
        setError(data?.error ?? "Arama yapılamadı.");
        setResults(null);
        return;
      }
      setResults(data?.results ?? []);
      setWarning(data?.warning ?? null);
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(null);
    }
  }

  async function submitRequest() {
    if (!selected) return;
    setError(null);
    setPending("request");
    try {
      const res = await fetch("/api/tenant/kurumsal/domain/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selected.domain,
          price: selected.price ?? null,
          period: selected.period ?? null,
          available: selected.available,
        }),
      });
      const data = (await res.json().catch(() => null)) as RequestResponse | null;
      if (!res.ok || !data?.request) {
        setError(data?.error ?? "Talep gönderilemedi.");
        return;
      }
      setRequest(data.request);
      setEmailNote(data.emailSent === false ? "Not: bildirim e-postası gönderilemedi; ekibimiz talebi panelden görecek." : null);
      onRequestChange?.(data.request);
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(null);
    }
  }

  async function cancel() {
    if (!request || !window.confirm(`${request.domain} talebi iptal edilsin mi?`)) return;
    setError(null);
    setPending("cancel");
    try {
      const res = await fetch("/api/tenant/kurumsal/domain/request", { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as RequestResponse | null;
      if (!res.ok) {
        setError(data?.error ?? "Talep iptal edilemedi.");
        return;
      }
      setRequest(null);
      setSelected(null);
      onRequestChange?.(null);
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(null);
    }
  }

  if (request) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Talebiniz alındı: <span className="font-mono">{request.domain}</span>
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/80">
              Satın alma ve bağlantı eKatalox ekibince yapılacak; tamamlanınca burada &quot;Bağlandı&quot; görünür.
              {request.price_usd !== null ? ` Talep anındaki fiyat: yıllık ~${formatUsd(request.price_usd)}.` : ""}
            </p>
            {emailNote ? <p className="mt-1 text-xs text-amber-700">{emailNote}</p> : null}
            <div className="mt-3">
              <Button variant="ghost" onClick={cancel} disabled={pending !== null} className="px-3 py-2 text-rose-600 hover:text-rose-700">
                {pending === "cancel" ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Talebi iptal et
              </Button>
            </div>
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
      <p className="text-sm font-semibold">Yeni alan adı seç</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Firmanızın adını yazın; hangi uzantıların boşta olduğunu ve yıllık fiyatını gösterelim. Seçtiğiniz alan adını ekibimiz
        sizin adınıza alır ve kurumsal sitenize bağlar.
      </p>
      <form onSubmit={search} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="firmaniz  ya da  firmaniz.com"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={253}
        />
        <Button type="submit" disabled={pending !== null} className="shrink-0">
          {pending === "search" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Ara
        </Button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {warning ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">{warning}</p> : null}

      {results ? (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {results.map((row) => {
            const active = selected?.domain === row.domain;
            const selectable = row.available !== false;
            return (
              <li key={row.domain}>
                <button
                  type="button"
                  disabled={!selectable}
                  onClick={() => setSelected(active ? null : row)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                    active ? "bg-emerald-50 dark:bg-emerald-950/40" : selectable ? "hover:bg-muted" : "",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                        active ? "border-emerald-600 bg-emerald-600" : "border-slate-300 dark:border-slate-600",
                      )}
                    >
                      {active ? <span className="size-1.5 rounded-full bg-white" /> : null}
                    </span>
                    <span className="truncate font-mono font-semibold">{row.domain}</span>
                  </span>
                  <AvailabilityBadge row={row} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg bg-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="font-mono font-semibold">{selected.domain}</span>
            {selected.available === true && selected.price !== undefined
              ? ` · yıllık ~${formatUsd(selected.price)}`
              : selected.available === null
                ? " · müsaitliği ekibimiz kontrol edecek"
                : ""}
          </span>
          <Button onClick={submitRequest} disabled={pending !== null} className="shrink-0">
            {pending === "request" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Bu alan adını talep et
          </Button>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        Fiyatlar Vercel alan adı servisinin o anki USD fiyatıdır; kesin tutar ekibimiz tarafından teyit edilir.{" "}
        <a href={domainRequestHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
          <MessageCircle className="size-3" /> WhatsApp&apos;tan da yazabilirsiniz
        </a>
      </p>
    </div>
  );
}

function AvailabilityBadge({ row }: { row: DomainSearchResult }) {
  if (row.available === true) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
        <CheckCircle2 className="size-3" /> Boşta
        {row.price !== undefined ? ` · yıllık ~${formatUsd(row.price)}` : ""}
        {row.premium ? " · premium" : ""}
      </span>
    );
  }
  if (row.available === false) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
        <XCircle className="size-3" /> Dolu
      </span>
    );
  }
  return (
    <span
      title={row.note}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    >
      <HelpCircle className="size-3" /> Kontrol edilemiyor
    </span>
  );
}
