"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { SignupRequestPage } from "@/lib/admin/self-service";
import { SIGNUP_STATUSES } from "@/lib/admin/self-service";
import { getEsnafPlanByPlanId, formatTry } from "@/lib/billing/esnaf-plans";
import { SECTOR_THEME_MAP } from "@/lib/storefront/esnaf-themes";
import type { SignupRequest, SignupRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<SignupRequestStatus, { label: string; variant: "success" | "danger" | "neutral" }> = {
  created: { label: "Oluşturuldu", variant: "success" },
  failed: { label: "Başarısız", variant: "danger" },
  cancelled: { label: "İptal", variant: "neutral" },
};

const PERIOD_LABELS: Record<string, string> = { monthly: "Aylık", yearly: "Yıllık" };

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function planLabel(planId: string) {
  return getEsnafPlanByPlanId(planId)?.name ?? planId;
}

function priceCell(row: SignupRequest) {
  if (row.list_price === null && row.final_price === null) {
    return "—";
  }
  const list = row.list_price ?? row.final_price ?? 0;
  const final = row.final_price ?? list;
  if (final === list) {
    return formatTry(final);
  }
  return (
    <span>
      <span className="text-slate-400 line-through">{formatTry(list)}</span>{" "}
      <span className="font-semibold text-emerald-700">{formatTry(final)}</span>
    </span>
  );
}

export function AdminSignupsPanel({
  initial,
  loadError,
}: {
  initial: SignupRequestPage;
  loadError: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<SignupRequestPage>(initial);
  const [status, setStatus] = useState<SignupRequestStatus | "">(initial.status ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(loadError);

  // Sunucudan yeni initial gelirse (URL değişimi) state'i eşitle — render
  // sırasında, effect değil (React "adjusting state when a prop changes").
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setData(initial);
    setStatus(initial.status ?? "");
  }

  async function load(nextPage: number, nextStatus: SignupRequestStatus | "") {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(nextPage) });
      if (nextStatus) qs.set("status", nextStatus);
      const response = await fetch(`/api/admin/signups?${qs.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Başvurular okunamadı.");
        return;
      }
      setData(result as SignupRequestPage);
      // URL'yi paylaşılabilir tut (yenilemede aynı sayfa/filtre gelsin).
      const urlQs = new URLSearchParams();
      if (nextPage > 1) urlQs.set("page", String(nextPage));
      if (nextStatus) urlQs.set("status", nextStatus);
      const suffix = urlQs.toString();
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const rangeStart = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(data.total, data.page * data.pageSize);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Başvurular</h2>
          <p className="mt-1 text-xs text-slate-500">
            {data.total.toLocaleString("tr-TR")} kayıt · {rangeStart}–{rangeEnd} gösteriliyor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onChange={(event) => {
              const next = event.target.value as SignupRequestStatus | "";
              setStatus(next);
              void load(1, next);
            }}
            className="w-auto py-2"
            aria-label="Durum filtresi"
          >
            <option value="">Tüm durumlar</option>
            {SIGNUP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </Select>
          {loading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
        </div>
      </div>

      {error ? (
        <p className="mx-5 mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {!data.rows.length ? (
        <p className="p-5 text-sm text-slate-500">
          {status ? "Bu durumda başvuru yok." : "Henüz başvuru yok."}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2 text-left">İşletme</th>
                <th className="px-4 py-2 text-left">Sektör</th>
                <th className="px-4 py-2 text-left">Yetkili</th>
                <th className="px-4 py-2 text-left">İletişim</th>
                <th className="px-4 py-2 text-left">İl / İlçe</th>
                <th className="px-4 py-2 text-left">Paket</th>
                <th className="px-4 py-2 text-left">Kupon</th>
                <th className="px-4 py-2 text-right">Fiyat</th>
                <th className="px-4 py-2 text-left">Durum</th>
                <th className="px-4 py-2 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.rows.map((row) => {
                const meta = STATUS_META[row.status] ?? STATUS_META.cancelled;
                const sector = row.sector ? (SECTOR_THEME_MAP[row.sector]?.label ?? row.sector) : "—";
                return (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{row.business_name}</p>
                      {row.tenant_id ? (
                        <Link
                          href={`/admin/tenants/${row.tenant_id}`}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                        >
                          {row.subdomain}.ekatalox.com <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-500">{row.subdomain}.ekatalox.com</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{sector}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{row.full_name}</td>
                    <td className="px-4 py-2.5">
                      <p className="whitespace-nowrap">{row.phone}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {[row.city, row.district].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <p>{planLabel(row.plan)}</p>
                      <p className="text-xs text-slate-500">{PERIOD_LABELS[row.billing_period] ?? row.billing_period}</p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{row.coupon_code ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{priceCell(row)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {row.status === "failed" && row.error ? (
                        <p className="mt-1 max-w-[220px] text-xs text-rose-700" title={row.error}>
                          {row.error}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(row.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800",
        )}
      >
        <span>
          Sayfa {data.page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={loading || data.page <= 1}
            onClick={() => load(data.page - 1, status)}
          >
            Önceki
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={loading || data.page >= totalPages}
            onClick={() => load(data.page + 1, status)}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </Card>
  );
}
