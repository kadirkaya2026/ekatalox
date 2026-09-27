"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Inbox, MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { DealerCustomerForm, type DealerCustomerFormValues } from "@/components/dashboard/dealer-customer-form";
import {
  DEALER_APPLICATION_STATUS_LABELS,
  normalizeTrPhoneDigits,
  type DealerApplication,
  type DealerApplicationStatus,
} from "@/lib/kurumsal/applications";
import type { PriceList } from "@/lib/types";
import { cn } from "@/lib/utils";

// Panel → Bayi Başvuruları. Yalnız bekleyenler (Yeni / Arandı) listelenir:
// "Onayla" kişiye özel şifre verip müşteriyi Müşteriler sayfasına taşır,
// "Reddet" başvuruyu listeden düşürür (27 Eyl 2026, Kurumsal paket).

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

type Filter = "all" | "new" | "contacted";

type ApprovedNotice = { name: string; phone: string; password: string; listName: string };

export function DealerApplicationsManager({
  initialApplications,
  formLive,
  priceLists,
  storefrontUrl,
}: {
  initialApplications: DealerApplication[];
  formLive: boolean;
  priceLists: PriceList[];
  storefrontUrl: string;
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<DealerApplication | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approved, setApproved] = useState<ApprovedNotice | null>(null);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: applications.length, new: 0, contacted: 0 };
    for (const item of applications) if (item.status === "new" || item.status === "contacted") result[item.status] += 1;
    return result;
  }, [applications]);

  const visible = filter === "all" ? applications : applications.filter((item) => item.status === filter);

  async function updateStatus(id: string, status: "new" | "contacted" | "rejected") {
    const previous = applications.find((item) => item.id === id);
    if (!previous) return;
    setError(null);
    setSavingId(id);
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
      setApplications((list) =>
        status === "rejected" ? list.filter((item) => item.id !== id) : list.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      setRejectingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

  async function approve(item: DealerApplication, values: DealerCustomerFormValues): Promise<string | null> {
    const res = await fetch(`/api/tenant/kurumsal/basvurular/${item.id}/onayla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) return result?.error ?? "Onaylanamadı.";
    const list = priceLists.find((entry) => entry.id === values.price_list_id);
    setApplications((current) => current.filter((entry) => entry.id !== item.id));
    setApproving(null);
    setApproved({
      name: values.customer_name,
      phone: values.customer_phone,
      password: values.password_code,
      listName: list?.name ?? "",
    });
    return null;
  }

  const approvedWaHref = approved?.phone
    ? `https://api.whatsapp.com/send?phone=${normalizeTrPhoneDigits(approved.phone)}&text=${encodeURIComponent(
        `Merhaba ${approved.name}, bayilik başvurunuz onaylandı. Kataloğumuza ${storefrontUrl} adresinden size özel şifrenizle girebilirsiniz.\nŞifreniz: ${approved.password}`,
      )}`
    : null;

  const approvedCard = approved ? (
    <Card className="flex flex-col gap-3 border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900 dark:bg-emerald-950/40">
      <p className="text-sm leading-6">
        <Check className="mr-1 inline size-4 text-emerald-600" />
        <b>{approved.name}</b> onaylandı ve <Link href="/customers" className="font-semibold underline underline-offset-4">Müşteriler</Link>{" "}
        sayfasına eklendi. Şifre: <span className="font-mono font-bold">{approved.password}</span>
        {approved.listName ? ` · ${approved.listName}` : ""}
      </p>
      <div className="flex shrink-0 gap-2">
        {approvedWaHref ? (
          <a
            href={approvedWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
          >
            <MessageCircle className="size-4" /> Şifreyi WhatsApp&apos;tan gönder
          </a>
        ) : null}
        <Button variant="ghost" onClick={() => setApproved(null)} aria-label="Kapat">
          <X className="size-4" />
        </Button>
      </div>
    </Card>
  ) : null;

  const approveModal = (
    <Modal open={Boolean(approving)} onClose={() => setApproving(null)} title="Başvuruyu onayla ve şifre ver">
      {approving ? (
        <DealerCustomerForm
          key={approving.id}
          priceLists={priceLists}
          submitLabel="Onayla ve şifreyi ver"
          initial={{
            customer_company: approving.company_name,
            customer_name: approving.contact_name,
            customer_phone: approving.phone,
            customer_city: approving.city ?? "",
            customer_address: approving.address ?? "",
            price_list_id: "",
            password_code: "",
          }}
          onSubmit={(values) => approve(approving, values)}
          onCancel={() => setApproving(null)}
        />
      ) : null}
    </Modal>
  );

  if (!applications.length) {
    return (
      <div className="space-y-4">
        {approvedCard}
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Inbox className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Henüz başvuru yok</h2>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Kurumsal sitenizdeki &quot;Bayimiz olun&quot; formunu dolduran firmalar burada listelenir. Firma adı, yetkili, telefon ve il bilgisiyle gelir; arayıp durumunu
          buradan işaretlersiniz. Onayladığınız firmaya kişiye özel şifre verirsiniz; Müşteriler sayfasına geçer.
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvedCard}
      {approveModal}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted"] as Filter[]).map((key) => (
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
                  {item.address ? <p className="text-sm text-muted-foreground">{item.address}</p> : null}
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
                  <Button
                    variant="secondary"
                    disabled={savingId === item.id}
                    onClick={() => updateStatus(item.id, item.status === "contacted" ? "new" : "contacted")}
                    title="Aradığınız başvuruyu işaretleyin"
                  >
                    <PhoneCall className="size-4" />
                    {item.status === "contacted" ? "Arandı ✓" : "Arandı"}
                  </Button>
                  <Button onClick={() => setApproving(item)} disabled={!priceLists.length}>
                    <Check className="size-4" /> Onayla
                  </Button>
                  {rejectingId === item.id ? (
                    <>
                      <Button variant="danger" disabled={savingId === item.id} onClick={() => updateStatus(item.id, "rejected")}>
                        Evet, reddet
                      </Button>
                      <Button variant="ghost" onClick={() => setRejectingId(null)}>
                        Vazgeç
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="text-rose-600" onClick={() => setRejectingId(item.id)}>
                      <X className="size-4" /> Reddet
                    </Button>
                  )}
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
