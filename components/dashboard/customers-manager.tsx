"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Loader2,
  Magnet,
  MessageCircle,
  Search,
  ShieldBan,
  ShieldOff,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { OrderStatus, StorefrontCustomerWithStats, StorefrontOrder } from "@/lib/types";
import { formatOrderTotal, formatPaymentMethod, formatOrderNo } from "@/lib/orders/format";
import { ORDER_STATUS_TONES, getStatusLabel } from "@/lib/orders/status";
import { formatMagnetCodeForPrint } from "@/lib/magnet/code-format";

type Customer = StorefrontCustomerWithStats;
type Filter = "all" | "active" | "quiet" | "magnet" | "blocked";
type SortKey = "last" | "total" | "count" | "name";

const DAY = 86_400_000;
const money = (v: number, c: string) => formatCurrency(v, c as CurrencyCode);

/** Para birimi haritasını "₺1.250 + $40" biçiminde yazar; boşsa "—". */
function formatTotals(totals: Record<string, number>) {
  const entries = Object.entries(totals).filter(([c, v]) => c !== "CATALOG" && v > 0);
  if (!entries.length) return "—";
  return entries.map(([c, v]) => money(v, c)).join(" + ");
}

function primaryAmount(totals: Record<string, number>) {
  // Sıralama/KPI için: TRY varsa TRY, yoksa ilk para birimi
  if (typeof totals.TRY === "number") return totals.TRY;
  const first = Object.entries(totals).find(([c]) => c !== "CATALOG");
  return first ? first[1] : 0;
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

function waHref(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `9${digits}` : digits.startsWith("90") ? digits : `90${digits}`;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function StatusBadge({ status, isTekel }: { status: OrderStatus; isTekel: boolean }) {
  return (
    <Badge className={cn("px-2 py-0.5 text-[11px]", ORDER_STATUS_TONES[status])}>
      {getStatusLabel(status, { isTekel })}
    </Badge>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cari detay: müşteri kartı + hareket dökümü (kümülatif bakiye ile)
// ---------------------------------------------------------------------------
function CustomerLedger({
  customer,
  orders,
  loading,
  isTekel,
  onBack,
  onToggleBlock,
  blockPending,
}: {
  customer: Customer;
  orders: StorefrontOrder[] | undefined;
  loading: boolean;
  isTekel: boolean;
  onBack: () => void;
  onToggleBlock: (customer: Customer) => void;
  blockPending: boolean;
}) {
  const [openOrder, setOpenOrder] = useState<StorefrontOrder | null>(null);
  const avg =
    customer.delivered_count > 0 ? primaryAmount(customer.totals_by_currency) / customer.delivered_count : 0;
  const mainCurrency = typeof customer.totals_by_currency.TRY === "number" ? "TRY" : Object.keys(customer.totals_by_currency)[0] ?? "TRY";

  // Kümülatif: eskiden yeniye teslim edilen tutar toplanır (cari bakiye gibi)
  const ledger = useMemo(() => {
    if (!orders) return [];
    const asc = [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at));
    let running = 0;
    const rows = asc.map((o) => {
      if (o.status === "delivered" && o.currency === mainCurrency) running += o.total_amount;
      return { order: o, running };
    });
    return rows.reverse();
  }, [orders, mainCurrency]);

  if (openOrder) {
    return (
      <Card className="p-5">
        <BackButton label="Cari dökümüne dön" onClick={() => setOpenOrder(null)} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            {formatOrderNo(openOrder)}
            <StatusBadge status={openOrder.status} isTekel={isTekel} />
          </h3>
          <span className="text-sm text-slate-500">{formatDate(openOrder.created_at)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{formatOrderTotal(openOrder)}</span>
          {formatPaymentMethod(openOrder.payment_method) ? (
            <>
              <span className="text-slate-300">•</span>
              <span>{formatPaymentMethod(openOrder.payment_method)}</span>
            </>
          ) : null}
        </div>
        {openOrder.note ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Not: </span>
            {openOrder.note}
          </p>
        ) : null}
        {openOrder.status === "cancelled" && openOrder.cancel_reason ? (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">İptal sebebi: {openOrder.cancel_reason}</p>
        ) : null}
        <div className="mt-4 space-y-2">
          {openOrder.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-900">
                  {item.product_name}
                  {item.variant_name ? <span className="text-slate-500"> · {item.variant_name}</span> : null}
                </p>
                <p className="text-slate-500">{item.quantity} {item.sales_unit ?? "adet"}</p>
              </div>
              {item.price !== null ? (
                <p className="font-medium text-slate-700">{money(item.price * item.quantity, item.currency)}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <BackButton label="Cari listesine dön" onClick={onBack} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-slate-900 text-base font-bold text-white">
              {getInitials(customer.full_name)}
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900">
                {customer.full_name}
                {customer.magnet_code ? (
                  <Badge variant="info" className="gap-1 px-2 py-0.5 text-[11px]">
                    <Magnet className="size-3" /> {formatMagnetCodeForPrint(customer.magnet_code)}
                  </Badge>
                ) : null}
                {customer.is_blocked ? (
                  <Badge variant="danger" className="px-2 py-0.5 text-[11px]">Engelli</Badge>
                ) : null}
              </h3>
              <p className="text-sm text-slate-600">{customer.phone}</p>
              {customer.address ? <p className="text-sm text-slate-500">{customer.address}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <a href={waHref(customer.phone, `Merhaba ${customer.full_name.split(" ")[0] ?? ""},`)} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
            <Button variant="ghost" disabled={blockPending} onClick={() => onToggleBlock(customer)} className={customer.is_blocked ? "" : "text-rose-600"}>
              {blockPending ? <Loader2 className="size-4 animate-spin" /> : customer.is_blocked ? <ShieldOff className="size-4" /> : <ShieldBan className="size-4" />}
              {customer.is_blocked ? "Engeli kaldır" : "Numarayı engelle"}
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Toplam alışveriş", formatTotals(customer.totals_by_currency)],
            ["Bekleyen", formatTotals(customer.pending_by_currency)],
            ["Sipariş", `${customer.orders_count} · ${customer.delivered_count} teslim · ${customer.cancelled_count} iptal`],
            ["Ortalama sepet", customer.delivered_count ? money(avg, mainCurrency) : "—"],
            ["İlk sipariş", formatDate(customer.first_order_at)],
            ["Son sipariş", `${formatDate(customer.last_order_at)} (${daysSince(customer.last_order_at)} gün önce)`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between px-5 pt-5">
          <h4 className="text-base font-semibold text-slate-900">Cari hareketleri</h4>
          <span className="text-xs text-slate-500">Kümülatif: yalnız teslim edilen {mainCurrency}</span>
        </div>
        {loading ? (
          <p className="flex items-center gap-2 p-5 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Yükleniyor…</p>
        ) : !orders?.length ? (
          <p className="p-5 text-sm text-slate-500">Hareket yok.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Tarih</th>
                  <th className="px-4 py-2 text-left">Sipariş</th>
                  <th className="px-4 py-2 text-left">Durum</th>
                  <th className="px-4 py-2 text-left">Ödeme</th>
                  <th className="px-4 py-2 text-right">Tutar</th>
                  <th className="px-4 py-2 text-right">Kümülatif</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledger.map(({ order, running }) => (
                  <tr key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpenOrder(order)}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{formatOrderNo(order)}</td>
                    <td className="px-4 py-2"><StatusBadge status={order.status} isTekel={isTekel} /></td>
                    <td className="px-4 py-2 text-slate-600">{formatPaymentMethod(order.payment_method) ?? "—"}</td>
                    <td className={cn("px-4 py-2 text-right tabular-nums", order.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-900")}>{formatOrderTotal(order)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{money(running, mainCurrency)}</td>
                    <td className="px-2 py-2 text-slate-300"><ChevronRight className="size-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group mb-4 -ml-2 flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Cari listesi
// ---------------------------------------------------------------------------
export function CustomersManager({
  initialCustomers,
  ordersEndpointBase = "/api/tenant/customers",
  isTekel = false,
}: {
  initialCustomers: Customer[];
  ordersEndpointBase?: string;
  isTekel?: boolean;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState<Record<string, StorefrontOrder[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("last");
  const [error, setError] = useState<string | null>(null);
  const [blockPending, setBlockPending] = useState(false);

  const kpis = useMemo(() => {
    const active = customers.filter((c) => daysSince(c.last_order_at) <= 30).length;
    const quiet = customers.filter((c) => daysSince(c.last_order_at) > 30).length;
    const totals: Record<string, number> = {};
    const pending: Record<string, number> = {};
    for (const c of customers) {
      for (const [cur, v] of Object.entries(c.totals_by_currency)) totals[cur] = (totals[cur] ?? 0) + v;
      for (const [cur, v] of Object.entries(c.pending_by_currency)) pending[cur] = (pending[cur] ?? 0) + v;
    }
    return { active, quiet, totals, pending };
  }, [customers]);

  const visible = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    let list = customers.filter((c) => {
      if (needle && !`${c.full_name} ${c.phone} ${c.address}`.toLocaleLowerCase("tr-TR").includes(needle)) return false;
      if (filter === "active") return daysSince(c.last_order_at) <= 30;
      if (filter === "quiet") return daysSince(c.last_order_at) > 30;
      if (filter === "magnet") return Boolean(c.magnet_code);
      if (filter === "blocked") return c.is_blocked;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "total") return primaryAmount(b.totals_by_currency) - primaryAmount(a.totals_by_currency);
      if (sort === "count") return b.orders_count - a.orders_count;
      if (sort === "name") return a.full_name.localeCompare(b.full_name, "tr");
      return b.last_order_at.localeCompare(a.last_order_at);
    });
    return list;
  }, [customers, q, filter, sort]);

  async function open(customer: Customer) {
    setSelected(customer);
    if (ordersByCustomer[customer.id]) return;
    setLoadingId(customer.id);
    setError(null);
    try {
      const response = await fetch(`${ordersEndpointBase}/${customer.id}/orders`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Hareketler yüklenemedi.");
      setOrdersByCustomer((curr) => ({ ...curr, [customer.id]: result.orders ?? [] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hareketler yüklenemedi.");
    } finally {
      setLoadingId(null);
    }
  }

  async function toggleBlock(customer: Customer) {
    setBlockPending(true);
    setError(null);
    const response = customer.is_blocked && customer.blocked_id
      ? await fetch(`/api/tenant/blocked-phones?id=${encodeURIComponent(customer.blocked_id)}`, { method: "DELETE" })
      : await fetch("/api/tenant/blocked-phones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: customer.phone, reason: `Cari: ${customer.full_name}` }),
        });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "İşlem yapılamadı.");
    } else {
      // Engel listesini yeniden çekmek yerine yerelde güncelle; id için listeyi tazele.
      const list = await fetch("/api/tenant/blocked-phones").then((r) => r.json()).catch(() => ({ phones: [] }));
      const byPhone = new Map<string, string>((list.phones ?? []).map((p: { id: string; phone: string }) => [p.phone, p.id]));
      const patch = (c: Customer) => ({ ...c, is_blocked: byPhone.has(c.phone), blocked_id: byPhone.get(c.phone) ?? null });
      setCustomers((curr) => curr.map(patch));
      setSelected((curr) => (curr ? patch(curr) : curr));
    }
    setBlockPending(false);
  }

  async function exportCsv() {
    const XLSX = await import("xlsx");
    const rows = [
      ["Ad Soyad", "Telefon", "Adres", "İlk sipariş", "Son sipariş", "Sipariş", "Teslim", "İptal", "Toplam alışveriş", "Bekleyen", "Magnet", "Engelli"],
      ...visible.map((c) => [
        c.full_name, c.phone, c.address, c.first_order_at.slice(0, 10), c.last_order_at.slice(0, 10),
        c.orders_count, c.delivered_count, c.cancelled_count,
        primaryAmount(c.totals_by_currency), primaryAmount(c.pending_by_currency),
        c.magnet_code ? formatMagnetCodeForPrint(c.magnet_code) : "", c.is_blocked ? "Evet" : "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cari");
    XLSX.writeFile(wb, `cari-listesi-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <InlineAlert tone="error" message={error} />
        <CustomerLedger
          customer={selected}
          orders={ordersByCustomer[selected.id]}
          loading={loadingId === selected.id}
          isTekel={isTekel}
          onBack={() => setSelected(null)}
          onToggleBlock={toggleBlock}
          blockPending={blockPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Toplam müşteri" value={String(customers.length)} hint={`${kpis.active} aktif (son 30 gün)`} />
        <Kpi label="Sessizleşen" value={String(kpis.quiet)} hint="30 günden uzun süredir sipariş yok" />
        <Kpi label="Toplam ciro (teslim)" value={formatTotals(kpis.totals)} />
        <Kpi label="Bekleyen tutar" value={formatTotals(kpis.pending)} hint="henüz teslim edilmemiş" />
      </div>

      <InlineAlert tone="error" message={error} />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "Tümü"],
            ["active", "Aktif (30 gün)"],
            ["quiet", "Sessizleşen"],
            ["magnet", "Magnetli"],
            ["blocked", "Engelli"],
          ] as Array<[Filter, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold",
              filter === key ? "bg-foreground text-background" : "border text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad, telefon, adres" className="w-56 pl-9" />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-44">
            <option value="last">Son siparişe göre</option>
            <option value="total">Toplam alışverişe göre</option>
            <option value="count">Sipariş adedine göre</option>
            <option value="name">Ada göre</option>
          </Select>
          <Button variant="ghost" onClick={() => void exportCsv()} title="Listeyi Excel olarak indir">
            <Download className="size-4" /> Excel
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-slate-500">
            <Users className="size-6 text-slate-300" />
            {customers.length === 0 ? "Henüz müşteri yok. Vitrinden gelen ilk sipariş cari kaydı oluşturur." : "Bu süzgeçte müşteri yok."}
          </div>
        ) : (
          <>
            {/* Masaüstü: tablo */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Müşteri</th>
                    <th className="px-4 py-2.5 text-left">Adres</th>
                    <th className="px-4 py-2.5 text-left">Son sipariş</th>
                    <th className="px-4 py-2.5 text-right">Sipariş</th>
                    <th className="px-4 py-2.5 text-right">Toplam alışveriş</th>
                    <th className="px-4 py-2.5 text-right">Bekleyen</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visible.map((c) => (
                    <tr key={c.id} className="cursor-pointer hover:bg-emerald-50/40" onClick={() => void open(c)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {getInitials(c.full_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">
                              {c.full_name}
                              {c.magnet_code ? <Magnet className="size-3.5 text-sky-600" aria-label="Magnetli müşteri" /> : null}
                              {c.is_blocked ? <Badge variant="danger" className="px-1.5 py-0 text-[10px]">Engelli</Badge> : null}
                            </p>
                            <p className="text-slate-500">{c.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-slate-600">{c.address || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-700">{formatDate(c.last_order_at)}</span>
                          {c.last_order_status ? <StatusBadge status={c.last_order_status} isTekel={isTekel} /> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-slate-900">{c.orders_count}</span>
                        {c.cancelled_count ? <span className="ml-1 text-xs text-rose-600">({c.cancelled_count} iptal)</span> : null}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatTotals(c.totals_by_currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-700">{formatTotals(c.pending_by_currency)}</td>
                      <td className="px-2 py-3 text-slate-300"><ChevronRight className="size-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobil: kart listesi */}
            <div className="divide-y md:hidden">
              {visible.map((c) => (
                <button key={c.id} type="button" onClick={() => void open(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{getInitials(c.full_name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{c.full_name}</p>
                    <p className="text-xs text-slate-500">{c.phone} · {c.orders_count} sipariş · {formatDate(c.last_order_at)}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">{formatTotals(c.totals_by_currency)}</span>
                  <ChevronRight className="size-4 text-slate-300" />
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
      <p className="text-xs text-slate-500">{visible.length} müşteri gösteriliyor · Toplam alışveriş yalnız teslim edilen siparişleri kapsar.</p>
    </div>
  );
}
