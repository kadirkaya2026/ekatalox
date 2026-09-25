"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  DOMAIN_REQUEST_STATUSES,
  DOMAIN_REQUEST_STATUS_LABELS,
  type AdminDomainRequest,
  type DomainRequestStatus,
} from "@/lib/kurumsal/domain-requests-shared";

// Süper admin → Başvurular → "Alan adı talepleri" (0135). Durum değişikliği
// anında kaydedilir; hata olursa eski değere döner. Satın alma Vercel
// panelinden elle yapılır, sonra tenant'ın kurumsal_domain'i doldurulur.

const VARIANT: Record<DomainRequestStatus, "info" | "success" | "neutral"> = {
  new: "info",
  purchased: "success",
  cancelled: "neutral",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(
    new Date(value),
  );
}

export function AdminDomainRequestsPanel({ initial }: { initial: AdminDomainRequest[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: DomainRequestStatus) {
    const previous = rows.find((row) => row.id === id)?.status;
    if (!previous || previous === status) return;
    setError(null);
    setSavingId(id);
    setRows((list) => list.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      const res = await fetch(`/api/admin/domain-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Durum kaydedilemedi.");
      }
    } catch (err) {
      setRows((list) => list.map((row) => (row.id === id ? { ...row, status: previous } : row)));
      setError(err instanceof Error ? err.message : "Durum kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

  if (!rows.length) {
    return <Card className="p-6 text-sm text-muted-foreground">Henüz alan adı talebi yok.</Card>;
  }

  return (
    <Card className="overflow-hidden">
      {error ? <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Tenant</th>
              <th className="px-4 py-2">Alan adı</th>
              <th className="px-4 py-2">Fiyat</th>
              <th className="px-4 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{formatDateTime(row.created_at)}</td>
                <td className="px-4 py-2">
                  {row.tenant ? (
                    <Link href={`/tenants/${row.tenant_id}`} className="inline-flex items-center gap-1 font-semibold hover:underline">
                      {row.tenant.company_name} <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {row.tenant ? <div className="text-xs text-muted-foreground">{row.tenant.subdomain} · {row.tenant.plan}</div> : null}
                </td>
                <td className="px-4 py-2">
                  <span className="font-mono font-semibold">{row.domain}</span>
                  {row.note ? <div className="text-xs text-muted-foreground">{row.note}</div> : null}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  {row.price_usd !== null ? `$${row.price_usd}${row.period_years && row.period_years > 1 ? ` / ${row.period_years} yıl` : " / yıl"}` : "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={VARIANT[row.status]}>{DOMAIN_REQUEST_STATUS_LABELS[row.status]}</Badge>
                    <Select
                      aria-label="Talep durumu"
                      value={row.status}
                      disabled={savingId === row.id}
                      onChange={(event) => updateStatus(row.id, event.target.value as DomainRequestStatus)}
                      className="w-auto py-1.5"
                    >
                      {DOMAIN_REQUEST_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {DOMAIN_REQUEST_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
