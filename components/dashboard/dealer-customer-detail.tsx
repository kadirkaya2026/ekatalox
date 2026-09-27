"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, BellRing, KeyRound, MapPin, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { DealerCustomerForm, type DealerCustomerFormValues } from "@/components/dashboard/dealer-customer-form";
import { normalizeTrPhoneDigits } from "@/lib/kurumsal/applications";
import type { DealerCustomer, DealerCustomerOrder } from "@/lib/kurumsal/dealer-customers";
import { formatOrderNo, formatOrderTotal } from "@/lib/orders/format";
import { ORDER_STATUS_TONES, getStatusLabel } from "@/lib/orders/status";
import type { CurrencyCode } from "@/lib/products/constants";
import type { PriceList } from "@/lib/types";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

// Panel → Müşteriler → müşteri sayfası (toptancı, Kurumsal paket): bilgiler,
// şifre, düzenle/sil ve müşterinin siparişleri + onaylanan sipariş toplamı.

type Group = "all" | "approved" | "pending" | "cancelled";

const APPROVED = new Set(["confirmed", "preparing", "shipped", "delivered"]);

function groupOf(order: DealerCustomerOrder): Exclude<Group, "all"> {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "new") return "pending";
  return "approved";
}

const GROUP_LABELS: Record<Group, string> = {
  all: "Tümü",
  approved: "Onaylanan",
  pending: "Onay bekleyen",
  cancelled: "İptal / reddedilen",
};

/** Para birimi başına toplam ("$1.240,00 + ₺3.500,00"); fiyatsız katalog hariç. */
function sumByCurrency(orders: DealerCustomerOrder[]) {
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (order.currency === "CATALOG") continue;
    totals.set(order.currency, (totals.get(order.currency) ?? 0) + Number(order.total_amount || 0));
  }
  if (!totals.size) return "—";
  return [...totals.entries()].map(([currency, total]) => formatCurrency(total, currency as CurrencyCode)).join(" + ");
}

export function DealerCustomerDetail({
  initialCustomer,
  orders,
  priceLists,
  storefrontUrl,
}: {
  initialCustomer: DealerCustomer;
  orders: DealerCustomerOrder[];
  priceLists: PriceList[];
  storefrontUrl: string;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initialCustomer);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group>("all");

  const listName = priceLists.find((list) => list.id === customer.price_list_id)?.name ?? customer.price_list_name ?? "";
  const title = customer.customer_company || customer.customer_name || "Müşteri";

  const stats = useMemo(() => {
    const approved = orders.filter((order) => APPROVED.has(order.status));
    const delivered = orders.filter((order) => order.status === "delivered");
    return {
      counts: {
        all: orders.length,
        approved: approved.length,
        pending: orders.filter((order) => order.status === "new").length,
        cancelled: orders.filter((order) => order.status === "cancelled").length,
      } as Record<Group, number>,
      approvedTotal: sumByCurrency(approved),
      deliveredTotal: sumByCurrency(delivered),
      deliveredCount: delivered.length,
    };
  }, [orders]);

  const visible = group === "all" ? orders : orders.filter((order) => groupOf(order) === group);

  const waHref = customer.customer_phone
    ? `https://api.whatsapp.com/send?phone=${normalizeTrPhoneDigits(customer.customer_phone)}&text=${encodeURIComponent(
        `Merhaba ${customer.customer_name ?? ""}, kataloğumuza ${storefrontUrl} adresinden size özel şifrenizle girebilirsiniz.\nŞifreniz: ${customer.password_code}`,
      )}`
    : null;

  async function save(values: DealerCustomerFormValues): Promise<string | null> {
    const res = await fetch(`/api/tenant/bayi-musteriler/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) return result?.error ?? "Kaydedilemedi.";
    setCustomer((current) => ({
      ...current,
      customer_company: values.customer_company.trim() || null,
      customer_name: values.customer_name.trim(),
      customer_phone: values.customer_phone.trim() || null,
      customer_city: values.customer_city.trim() || null,
      customer_address: values.customer_address.trim() || null,
      price_list_id: values.price_list_id,
      price_list_name: priceLists.find((list) => list.id === values.price_list_id)?.name ?? null,
      password_code: values.password_code,
    }));
    setEditing(false);
    router.refresh();
    return null;
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tenant/bayi-musteriler/${customer.id}`, { method: "DELETE" });
    const result = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(result?.error ?? "Silinemedi.");
      return;
    }
    router.push("/customers");
    router.refresh();
  }

  const statCard = "rounded-2xl border border-slate-200 bg-white p-4";

  return (
    <div className="space-y-5">
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Müşteriler
      </Link>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
              {title}
              {customer.customer_company && customer.customer_name ? (
                <span className="text-base font-normal text-slate-500">· {customer.customer_name}</span>
              ) : null}
              {customer.has_push ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <BellRing className="size-3" /> Bildirim açık
                </span>
              ) : null}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono font-semibold text-emerald-800">
                <KeyRound className="size-3.5" /> {customer.password_code}
              </span>
              <span className="font-medium">{listName}</span>
              {customer.customer_phone ? (
                <a href={`tel:+${normalizeTrPhoneDigits(customer.customer_phone)}`} className="inline-flex items-center gap-1 text-slate-600 hover:underline">
                  <Phone className="size-3.5" /> {customer.customer_phone}
                </a>
              ) : null}
            </p>
            {customer.customer_address || customer.customer_city ? (
              <p className="flex items-start gap-1 text-sm text-slate-500">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {[customer.customer_address, customer.customer_city].filter(Boolean).join(" / ")}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
              >
                <MessageCircle className="size-4" /> Şifreyi gönder
              </a>
            ) : null}
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Düzenle
            </Button>
            {confirmDelete ? (
              <>
                <Button variant="danger" disabled={busy} onClick={() => void remove()}>
                  Evet, sil
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Vazgeç
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className="text-rose-600"
                title="Müşteriyi siler; şifresi artık çalışmaz"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> Sil
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Onaylanan siparişler</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.approvedTotal}</p>
          <p className="mt-0.5 text-sm text-slate-500">{stats.counts.approved} sipariş</p>
        </div>
        <div className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teslim edilen</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.deliveredTotal}</p>
          <p className="mt-0.5 text-sm text-slate-500">{stats.deliveredCount} sipariş</p>
        </div>
        <div className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Onay bekleyen</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{stats.counts.pending}</p>
          <p className="mt-0.5 text-sm text-slate-500">sipariş</p>
        </div>
        <div className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">İptal / reddedilen</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700">{stats.counts.cancelled}</p>
          <p className="mt-0.5 text-sm text-slate-500">sipariş</p>
        </div>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 className="text-base font-semibold">Siparişleri</h3>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(GROUP_LABELS) as Group[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setGroup(key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  group === key ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {GROUP_LABELS[key]} ({stats.counts[key]})
              </button>
            ))}
          </div>
        </div>
        {visible.length ? (
          <div className="divide-y divide-slate-100">
            {visible.map((order) => (
              <Link
                key={order.id}
                href={`/siparisler?order=${order.id}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 text-sm hover:bg-slate-50 sm:grid-cols-[100px_130px_minmax(0,1fr)_auto]"
              >
                <span className="font-semibold tabular-nums">{formatOrderNo(order)}</span>
                <span
                  className={cn(
                    "w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    ORDER_STATUS_TONES[order.status],
                  )}
                >
                  {getStatusLabel(order.status)}
                </span>
                <span className="col-span-3 tabular-nums text-slate-500 sm:col-span-1">
                  {formatDateTime(order.created_at)} · {order.item_count} kalem
                </span>
                <span
                  className={cn(
                    "col-start-3 row-start-1 text-right font-semibold tabular-nums sm:col-start-auto sm:row-start-auto",
                    order.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-900",
                  )}
                >
                  {formatOrderTotal(order)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            {orders.length ? "Bu durumda sipariş yok." : "Bu müşteriden henüz sipariş gelmedi."}
          </p>
        )}
      </Card>

      <Modal open={editing} onClose={() => setEditing(false)} title="Müşteriyi düzenle">
        {editing ? (
          <DealerCustomerForm
            priceLists={priceLists}
            submitLabel="Kaydet"
            initial={{
              customer_company: customer.customer_company ?? "",
              customer_name: customer.customer_name ?? "",
              customer_phone: customer.customer_phone ?? "",
              customer_city: customer.customer_city ?? "",
              customer_address: customer.customer_address ?? "",
              price_list_id: customer.price_list_id,
              password_code: customer.password_code,
            }}
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
