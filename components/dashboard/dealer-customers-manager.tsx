"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, ChevronDown, KeyRound, Loader2, MessageCircle, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DealerCustomerForm, type DealerCustomerFormValues } from "@/components/dashboard/dealer-customer-form";
import Link from "next/link";
import { normalizeTrPhoneDigits } from "@/lib/kurumsal/applications";
import { formatOrderNo, formatOrderTotal } from "@/lib/orders/format";
import { ORDER_STATUS_TONES, getStatusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import type { DealerCustomer } from "@/lib/kurumsal/dealer-customers";
import type { PriceList } from "@/lib/types";

// Panel → Müşteriler (toptancı, Kurumsal paket): kişiye özel şifreli bayi
// müşterileri. Onaylı başvurular buraya düşer; elle de eklenebilir.

type CustomerOrder = {
  id: string;
  order_no: number | null;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  currency: string;
  total_amount: number;
  item_count: number;
};

// Karta tıklayınca açılan sipariş listesi; satır Siparişler'de o siparişi açar.
function CustomerOrders({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/tenant/bayi-musteriler/${customerId}/siparisler`)
      .then(async (res) => {
        const result = (await res.json().catch(() => null)) as { orders?: CustomerOrder[]; error?: string } | null;
        if (cancelled) return;
        if (!res.ok || !result?.orders) setError(result?.error ?? "Siparişler okunamadı.");
        else setOrders(result.orders);
      })
      .catch(() => !cancelled && setError("Siparişler okunamadı."));
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!orders) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Siparişler yükleniyor…
      </p>
    );
  }
  if (!orders.length) return <p className="text-sm text-muted-foreground">Bu müşteriden henüz sipariş gelmedi.</p>;
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/siparisler?order=${order.id}`}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-3 py-2.5 text-sm hover:bg-slate-50 sm:grid-cols-[90px_120px_minmax(0,1fr)_auto]"
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
          <span className="col-span-3 text-slate-500 tabular-nums sm:col-span-1">
            {formatDateTime(order.created_at)} · {order.item_count} kalem
          </span>
          <span className="col-start-3 row-start-1 text-right font-semibold tabular-nums sm:col-start-auto sm:row-start-auto">
            {formatOrderTotal(order)}
          </span>
        </Link>
      ))}
    </div>
  );
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

function toFormValues(customer: DealerCustomer): DealerCustomerFormValues {
  return {
    customer_company: customer.customer_company ?? "",
    customer_name: customer.customer_name ?? "",
    customer_phone: customer.customer_phone ?? "",
    customer_city: customer.customer_city ?? "",
    customer_address: customer.customer_address ?? "",
    price_list_id: customer.price_list_id,
    password_code: customer.password_code,
  };
}

const EMPTY: DealerCustomerFormValues = {
  customer_company: "",
  customer_name: "",
  customer_phone: "",
  customer_city: "",
  customer_address: "",
  price_list_id: "",
  password_code: "",
};

export function DealerCustomersManager({
  initialCustomers,
  priceLists,
  storefrontUrl,
}: {
  initialCustomers: DealerCustomer[];
  priceLists: PriceList[];
  storefrontUrl: string;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<DealerCustomer | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listName = (id: string) => priceLists.find((list) => list.id === id)?.name ?? "";

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.customer_company, customer.customer_name, customer.customer_phone, customer.customer_city, customer.password_code]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("tr").includes(q)),
    );
  }, [customers, query]);

  async function save(values: DealerCustomerFormValues): Promise<string | null> {
    const isNew = editing === "new";
    const res = await fetch(isNew ? "/api/tenant/bayi-musteriler" : `/api/tenant/bayi-musteriler/${(editing as DealerCustomer).id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await res.json().catch(() => null)) as { error?: string; accessCodeId?: string } | null;
    if (!res.ok) return result?.error ?? "Kaydedilemedi.";
    const fields = {
      customer_company: values.customer_company.trim() || null,
      customer_name: values.customer_name.trim(),
      customer_phone: values.customer_phone.trim() || null,
      customer_city: values.customer_city.trim() || null,
      customer_address: values.customer_address.trim() || null,
      price_list_id: values.price_list_id,
      price_list_name: listName(values.price_list_id),
      password_code: values.password_code,
    };
    if (isNew) {
      setCustomers((list) => [
        {
          id: result?.accessCodeId ?? crypto.randomUUID(),
          customer_note: null,
          dealer_application_id: null,
          created_at: new Date().toISOString(),
          order_count: 0,
          last_order_at: null,
          has_push: false,
          ...fields,
        },
        ...list,
      ]);
    } else {
      const id = (editing as DealerCustomer).id;
      setCustomers((list) => list.map((customer) => (customer.id === id ? { ...customer, ...fields } : customer)));
    }
    setEditing(null);
    return null;
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/tenant/bayi-musteriler/${id}`, { method: "DELETE" });
    const result = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusyId(null);
    if (!res.ok) {
      setError(result?.error ?? "Silinemedi.");
      return;
    }
    setCustomers((list) => list.filter((customer) => customer.id !== id));
    setDeletingId(null);
  }

  const waHref = (customer: DealerCustomer) =>
    customer.customer_phone
      ? `https://api.whatsapp.com/send?phone=${normalizeTrPhoneDigits(customer.customer_phone)}&text=${encodeURIComponent(
          `Merhaba ${customer.customer_name ?? ""}, kataloğumuza ${storefrontUrl} adresinden size özel şifrenizle girebilirsiniz.\nŞifreniz: ${customer.password_code}`,
        )}`
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Firma, ad, telefon, il veya şifre ara"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setEditing("new")} disabled={!priceLists.length}>
          <Plus className="size-4" /> Müşteri ekle
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {!customers.length ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Users className="size-6" />
          </div>
          <h2 className="text-lg font-semibold">Henüz müşteri yok</h2>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            Bayi Başvuruları&apos;nda bir başvuruyu onaylayıp şifre verdiğinizde müşteri buraya gelir. &quot;Müşteri ekle&quot; ile başvurusuz da
            ekleyebilirsiniz. Ortak liste şifreleriniz (Şifreler sayfası) aynen çalışmaya devam eder.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((customer) => {
            const wa = waHref(customer);
            return (
              <Card key={customer.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <button
                    type="button"
                    onClick={() => setOpenId((current) => (current === customer.id ? null : customer.id))}
                    aria-expanded={openId === customer.id}
                    className="min-w-0 space-y-1.5 text-left"
                  >
                    <h3 className="text-base font-semibold">
                      {customer.customer_company || customer.customer_name}
                      {customer.customer_company && customer.customer_name ? (
                        <span className="font-normal text-muted-foreground"> · {customer.customer_name}</span>
                      ) : null}
                      {customer.has_push ? (
                        <span
                          className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-emerald-800"
                          title="Bu müşteriye panelden bildirim gönderebilirsiniz"
                        >
                          <BellRing className="size-3" /> Bildirim açık
                        </span>
                      ) : null}
                    </h3>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono font-semibold text-emerald-800">
                        <KeyRound className="size-3.5" /> {customer.password_code}
                      </span>
                      <span className="font-medium">{customer.price_list_name ?? listName(customer.price_list_id)}</span>
                      <span className="text-muted-foreground">
                        {customer.order_count} sipariş
                        {customer.last_order_at ? ` · son ${dateFormatter.format(new Date(customer.last_order_at))}` : ""}
                      </span>
                    </p>
                    {customer.customer_address || customer.customer_city ? (
                      <p className="text-sm text-muted-foreground">
                        {[customer.customer_address, customer.customer_city].filter(Boolean).join(" / ")}
                      </p>
                    ) : null}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <ChevronDown className={cn("size-4 transition", openId === customer.id && "rotate-180")} />
                      {openId === customer.id ? "Siparişleri gizle" : "Siparişlerini gör"}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {customer.customer_phone ? (
                      <a
                        href={`tel:+${normalizeTrPhoneDigits(customer.customer_phone)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-muted"
                      >
                        <Phone className="size-4" /> {customer.customer_phone}
                      </a>
                    ) : null}
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Şifreyi WhatsApp'tan gönder"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
                      >
                        <MessageCircle className="size-4" /> Şifreyi gönder
                      </a>
                    ) : null}
                    <Button variant="secondary" onClick={() => setEditing(customer)}>
                      <Pencil className="size-4" /> Düzenle
                    </Button>
                    {deletingId === customer.id ? (
                      <>
                        <Button variant="danger" disabled={busyId === customer.id} onClick={() => remove(customer.id)}>
                          Evet, sil
                        </Button>
                        <Button variant="ghost" onClick={() => setDeletingId(null)}>
                          Vazgeç
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        className="text-rose-600"
                        title="Müşteriyi siler; şifresi artık çalışmaz"
                        onClick={() => setDeletingId(customer.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {openId === customer.id ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <CustomerOrders customerId={customer.id} />
                  </div>
                ) : null}
              </Card>
            );
          })}
          {!visible.length ? <p className="py-6 text-center text-sm text-muted-foreground">Aramaya uyan müşteri yok.</p> : null}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Yeni müşteri" : "Müşteriyi düzenle"}
      >
        {editing !== null ? (
          <DealerCustomerForm
            key={editing === "new" ? "new" : editing.id}
            priceLists={priceLists}
            submitLabel={editing === "new" ? "Müşteriyi ekle" : "Kaydet"}
            initial={editing === "new" ? EMPTY : toFormValues(editing)}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
