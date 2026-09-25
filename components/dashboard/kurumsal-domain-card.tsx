"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { KurumsalDomainSearch } from "@/components/dashboard/kurumsal-domain-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DomainRequest } from "@/lib/kurumsal/domain-requests";
import type { KurumsalDomainStatus, VercelDnsRecord } from "@/lib/vercel/domains";

// Ayarlar → Kurumsal Site → Alan adı. Tenant kendi alan adını bağlar:
// kaydedince Vercel projesine kök + www eklenir (PUT /api/tenant/kurumsal/domain),
// "Kontrol et" Vercel'den doğrulama/DNS durumunu sorar ve eksik kaydı gösterir.
// Vercel API yapılandırılmamışsa alan adı yine kaydedilir, bağlantıyı ekip tamamlar.
// Alan adı bağlı değilken altta "Yeni alan adı seç" araması (KurumsalDomainSearch).

type ApiResult = { domain?: string | null; status?: KurumsalDomainStatus | null; warning?: string; error?: string };

export function KurumsalDomainCard({
  initialDomain,
  domainRequestHref,
  onDomainChange,
  initialRequest = null,
  onRequestChange,
}: {
  initialDomain: string | null;
  /** Destek WhatsApp bağlantısı (arama çalışmazsa alternatif) */
  domainRequestHref: string;
  onDomainChange: (domain: string | null) => void;
  /** Bekleyen "yeni alan adı" talebi */
  initialRequest?: DomainRequest | null;
  onRequestChange?: (request: DomainRequest | null) => void;
}) {
  const [domain, setDomain] = useState(initialDomain);
  const [draft, setDraft] = useState(initialDomain ?? "");
  const [status, setStatus] = useState<KurumsalDomainStatus | null>(null);
  const [pending, setPending] = useState<null | "save" | "check" | "remove">(initialDomain ? "check" : null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function call(method: "GET" | "PUT" | "DELETE", body?: unknown): Promise<ApiResult | null> {
    try {
      const res = await fetch("/api/tenant/kurumsal/domain", {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      const result = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok) {
        setError(result?.error ?? "İşlem tamamlanamadı.");
        return null;
      }
      return result;
    } catch {
      setError("Bağlantı kurulamadı.");
      return null;
    }
  }

  async function check() {
    setError(null);
    setPending("check");
    const result = await call("GET");
    if (result) setStatus(result.status ?? null);
    setPending(null);
  }

  // Sayfa açılınca bağlı alan adının durumunu bir kez sor.
  useEffect(() => {
    if (!initialDomain) return;
    let cancelled = false;
    fetch("/api/tenant/kurumsal/domain", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<ApiResult>) : null))
      .then((result) => {
        if (!cancelled && result) setStatus(result.status ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPending(null);
      });
    return () => {
      cancelled = true;
    };
  }, [initialDomain]);

  async function save() {
    setError(null);
    setWarning(null);
    if (!draft.trim()) return setError("Alan adını yazın. Örn: firmaniz.com");
    setPending("save");
    const result = await call("PUT", { domain: draft });
    if (result) {
      setDomain(result.domain ?? null);
      setDraft(result.domain ?? "");
      setStatus(result.status ?? null);
      setWarning(result.warning ?? null);
      onDomainChange(result.domain ?? null);
    }
    setPending(null);
  }

  async function remove() {
    if (!window.confirm("Alan adı kaldırılsın mı? Kurumsal siteniz bu adreste açılmaz.")) return;
    setError(null);
    setWarning(null);
    setPending("remove");
    const result = await call("DELETE");
    if (result) {
      setDomain(null);
      setDraft("");
      setStatus(null);
      onDomainChange(null);
    }
    setPending(null);
  }

  const busy = pending !== null;
  const changed = draft.trim().toLowerCase() !== (domain ?? "");

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Globe className="size-5 text-emerald-700 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold">Alan adı</h2>
        {domain ? (
          status?.connected ? (
            <Badge variant="success">Bağlandı ✓</Badge>
          ) : status && !status.configured ? (
            <Badge variant="warning">Ekip tarafından bağlanacak</Badge>
          ) : (
            <Badge variant="warning">DNS bekleniyor</Badge>
          )
        ) : (
          <Badge variant="neutral">Bağlı değil</Badge>
        )}
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Kurumsal siteniz kendi alan adınızın kökünde açılır (ör. <span className="font-medium text-foreground">firmaniz.com</span>).
        Sipariş/katalog ekranınız bugünkü adresinde kalır; sitedeki &quot;Bayi Girişi&quot; oraya yönlendirir.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="firmaniz.com"
          maxLength={253}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={busy || !changed}>
            {pending === "save" ? <Loader2 className="size-4 animate-spin" /> : null}
            {domain ? "Alan adını değiştir" : "Bağla"}
          </Button>
          {domain ? (
            <>
              <Button variant="secondary" onClick={check} disabled={busy}>
                {pending === "check" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Kontrol et
              </Button>
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-muted dark:text-emerald-400"
              >
                <ExternalLink className="size-4" /> Siteyi aç
              </a>
              <Button variant="ghost" onClick={remove} disabled={busy} className="text-rose-600 hover:text-rose-700">
                {pending === "remove" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Kaldır
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {warning ? <p className="mt-3 text-sm text-amber-700">{warning}</p> : null}

      {domain ? <DomainStatusDetails domain={domain} status={status} loading={pending === "check"} /> : null}

      {!domain ? (
        <div className="mt-5">
          <KurumsalDomainSearch
            initialRequest={initialRequest}
            domainRequestHref={domainRequestHref}
            onRequestChange={onRequestChange}
          />
        </div>
      ) : null}
    </Card>
  );
}

function DomainStatusDetails({
  domain,
  status,
  loading,
}: {
  domain: string;
  status: KurumsalDomainStatus | null;
  loading: boolean;
}) {
  if (!status) {
    return loading ? (
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Durum kontrol ediliyor…
      </p>
    ) : null;
  }

  if (status.connected) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        <CheckCircle2 className="size-4" /> {domain} ve www.{domain} bağlandı; kurumsal siteniz bu adreste yayında.
      </p>
    );
  }

  const hostErrors = [status.apex, status.www].filter((host) => host?.error).map((host) => `${host!.domain}: ${host!.error}`);

  return (
    <div className="mt-4 space-y-3">
      {!status.configured ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Alan adınız kaydedildi. Aşağıdaki DNS kayıtlarını girin; bağlantı eKatalox ekibi tarafından tamamlanacak.
        </p>
      ) : (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Clock className="size-4 shrink-0" /> DNS bekleniyor: alan adınızın DNS panelinde aşağıdaki kayıtları ekleyin, sonra
          &quot;Kontrol et&quot;e basın. DNS değişikliği birkaç dakika ile birkaç saat arasında yayılır.
        </p>
      )}
      <DnsRecordsTable records={status.records} />
      {hostErrors.length ? (
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          {hostErrors.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Alan adında başka kayıtlarla çakışan eski bir A/CNAME kaydı varsa (ör. eski web sitesi) onu silin; e-posta (MX) kayıtlarına
        dokunmayın.
      </p>
    </div>
  );
}

function DnsRecordsTable({ records }: { records: VercelDnsRecord[] }) {
  if (!records.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Tür</th>
            <th className="px-3 py-2">Ad / Host</th>
            <th className="px-3 py-2">Değer</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.type}-${record.name}-${record.value}`} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 font-semibold">{record.type}</td>
              <td className="px-3 py-2 font-mono text-xs">{record.name}</td>
              <td className="break-all px-3 py-2 font-mono text-xs">{record.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
