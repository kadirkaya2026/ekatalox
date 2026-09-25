"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  DEALER_APPLICATION_STATUSES,
  DEALER_APPLICATION_STATUS_LABELS,
  normalizeTrPhoneDigits,
  type DealerApplication,
  type DealerApplicationStatus,
} from "@/lib/kurumsal/applications";
import { cn } from "@/lib/utils";

// Panel → Bayi Başvuruları listesi. Durum değişikliği anında kaydedilir
// (PATCH /api/tenant/kurumsal/basvurular/[id]); hata olursa eski değere döner.

const STATUS_VARIANT: Record<DealerApplicationStatus, "info" | "warning" | "success" | "danger"> = {
  new: "info",
  contacted: "warning",
  approved: "success",
  rejected: "danger",
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Filter = "all" | DealerApplicationStatus;

export function DealerApplicationsManager({
  initialApplications,
  formLive,
}: {
  initialApplications: DealerApplication[];
  formLive: boolean;
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: applications.length, new: 0, contacted: 0, approved: 0, rejected: 0 };
    for (const item of applications) result[item.status] += 1;
    return result;
  }, [applications]);

  const visible = filter === "all" ? applications : applications.filter((item) => item.status === filter);

  async function updateStatus(id: string, status: DealerApplicationStatus) {
    const previous = applications.find((item) => item.id === id)?.status;
    if (!previous || previous === status) return;
    setError(null);
    setSavingId(id);
    setApplications((list) => list.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      const res = await fetch(`/api/tenant/kurumsal/basvurular/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? "Durum kaydedilemedi.");
      }
    } catch (err) {
      setApplications((list) => list.map((item) => (item.id === id ? { ...item, status: previous } : item)));
      setError(err instanceof Error ? err.message : "Durum kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

  if (!applications.length) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Inbox className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Henüz başvuru yok</h2>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Kurumsal sitenizdeki &quot;Bayimiz olun&quot; formunu dolduran firmalar burada listelenir. Firma adı, yetkili, telefon ve il bilgisiyle gelir; arayıp durumunu
          buradan işaretlersiniz.
        </p>
        {!formLive ? (
          <p className="text-sm text-muted-foreground">
            Başvuru formu şu an yayında değil.{" "}
            <Link href="/settings/kurumsal" className="font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400">
              Kurumsal siteyi kurun
            </Link>
          </p>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...DEALER_APPLICATION_STATUSES] as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              filter === key
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-card text-muted-foreground hover:text-foreground dark:border-slate-700",
            )}
          >
            {key === "all" ? "Tümü" : DEALER_APPLICATION_STATUS_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {visible.map((item) => {
          const digits = normalizeTrPhoneDigits(item.phone);
          const waText = encodeURIComponent(`Merhaba ${item.contact_name}, bayilik başvurunuz için yazıyoruz.`);
          return (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{item.company_name}</h3>
                    <Badge variant={STATUS_VARIANT[item.status]}>{DEALER_APPLICATION_STATUS_LABELS[item.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.contact_name}
                    {item.city ? ` · ${item.city}` : ""} · {dateFormatter.format(new Date(item.created_at))}
                  </p>
                  {item.note ? (
                    <p className="whitespace-pre-wrap break-words rounded-lg bg-muted px-3 py-2 text-sm">{item.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <a
                    href={`tel:+${digits}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-muted dark:border-slate-700"
                  >
                    <Phone className="size-4" /> {item.phone}
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?phone=${digits}&text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                  <Select
                    aria-label="Başvuru durumu"
                    value={item.status}
                    disabled={savingId === item.id}
                    onChange={(event) => updateStatus(item.id, event.target.value as DealerApplicationStatus)}
                    className="w-auto py-2"
                  >
                    {DEALER_APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {DEALER_APPLICATION_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>
          );
        })}
        {!visible.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Bu durumda başvuru yok.</p>
        ) : null}
      </div>
    </div>
  );
}
