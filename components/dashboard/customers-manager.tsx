"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  ChevronRight,
  Download,
  Gift,
  Loader2,
  Magnet,
  MessageCircle,
  Search,
  ShieldBan,
  ShieldOff,
  Trash2,
  Users,
} from "lucide-react";
import { CustomerCouponPanel } from "@/components/dashboard/customer-coupon-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { Category, OrderStatus, StorefrontCustomerWithStats, StorefrontOrder } from "@/lib/types";
import { formatOrderTotal, formatPaymentMethod, formatOrderNo } from "@/lib/orders/format";
import { ORDER_STATUS_TONES, getStatusLabel } from "@/lib/orders/status";
import { formatMagnetCodeForPrint } from "@/lib/magnet/code-format";

type Customer = StorefrontCustomerWithStats;
type Filter = "all" | "active" | "quiet" | "blocked";
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

function CustomerLedger({
  customer,
  orders,
  loading,
  isTekel,
  onBack,
  onToggleBlock,
  blockPending,
  categories,
  onDelete,
  deletePending,
}: {
  customer: Customer;
  orders: StorefrontOrder[] | undefined;
  loading: boolean;
  isTekel: boolean;
  onBack: () => void;
  onToggleBlock: (customer: Customer) => void;
  blockPending: boolean;
  categories: Category[];
  onDelete: (customer: Customer) => void;
  deletePending: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rows = useMemo(
    () => (orders ? [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)) : []),
    [orders],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <BackButton label="Müşteriler" onClick={onBack} />
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <a href={waHref(customer.phone, `Merhaba ${customer.full_name.split(" ")[0] ?? ""},`)} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button
            variant="secondary"
            disabled={blockPending}
            onClick={() => onToggleBlock(customer)}
            className={customer.is_blocked ? "" : "text-rose-600"}
            title={customer.is_blocked ? "Bu numara tekrar sipariş verebilsin" : "Bu numaradan sipariş alınmasın"}
          >
            {blockPending ? <Loader2 className="size-4 animate-spin" /> : customer.is_blocked ? <ShieldOff className="size-4" /> : <ShieldBan className="size-4" />}
            {customer.is_blocked ? "Engeli kaldır" : "Engelle"}
          </Button>
          <Button
            variant="ghost"
            disabled={deletePending}
            onClick={() => setConfirmDelete((v) => !v)}
            className="text-rose-600"
            title="Müşteri kaydını sil"
          >
            <Trash2 className="size-4" />
            Sil
          </Button>
        </div>
      </div>

      {confirmDelete ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>
            <strong>{customer.full_name}</strong> silinsin mi? Sipariş geçmişi silinmez (Siparişler'de kalır) ama bu cari kaydı,
            kuponları ve bildirim abonelikleri kaldırılır. Aynı numarayla yeni sipariş gelirse kayıt yeniden oluşur.
          </span>
          <span className="flex gap-2">
            <Button variant="danger" disabled={deletePending} onClick={() => onDelete(customer)}>
              {deletePending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Evet, sil
            </Button>
            <Button variant="ghost" disabled={deletePending} onClick={() => setConfirmDelete(false)}>Vazgeç</Button>
          </span>
        </div>
      ) : null}

      <div className="space-y-5 p-5">
        {/* Kimlik */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-slate-900 text-base font-bold text-white">
              {getInitials(customer.full_name)}
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-slate-900">
                {customer.full_name}
                {customer.is_blocked ? <Badge variant="danger" className="px-2 py-0.5 text-[11px]">Engelli</Badge> : null}
                {customer.has_push ? (
                  <Badge variant="success" className="gap-1 px-2 py-0.5 text-[11px]">
                    <BellRing className="size-3" /> Bildirim açık
                  </Badge>
                ) : null}
                {customer.magnet_code ? (
                  <Badge variant="info" className="gap-1 px-2 py-0.5 text-[11px]">
                    <Magnet className="size-3" /> {formatMagnetCodeForPrint(customer.magnet_code)}
                  </Badge>
                ) : null}
              </h3>
              <a href={`tel:${customer.phone}`} className="text-sm text-slate-700 hover:underline">{customer.phone}</a>
              {customer.address ? <p className="text-sm text-slate-500">{customer.address}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatTotals(customer.totals_by_currency)}</p>
            <p className="text-sm text-slate-500">
              {customer.orders_count} sipariş · son {formatDate(customer.last_order_at)}
            </p>
          </div>
        </div>

        {/* Müşteriye özel kupon */}
        <CustomerCouponPanel customerId={customer.id} hasPush={customer.has_push} initialActive={customer.active_coupon} categories={categories} />

        {/* Siparişler */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden grid-cols-[130px_minmax(0,1fr)_150px_120px] gap-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Tarih</span><span>Sipariş</span><span>Durum</span><span className="text-right">Tutar</span>
          </div>
          {loading ? (
            <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Sipariş yok.</p>
          ) : (
            rows.map((order) => (
              <a
                key={order.id}
                href={`/dashboard/siparisler?order=${order.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-slate-100 px-4 py-2.5 text-sm hover:bg-slate-50 md:grid-cols-[130px_minmax(0,1fr)_150px_120px]"
                title="Siparişi aç"
              >
                <span className="text-slate-500">{formatDate(order.created_at)}</span>
                <span className={cn("text-right font-semibold tabular-nums md:hidden", order.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-900")}>{formatOrderTotal(order)}</span>
                <span className="truncate font-medium text-slate-900">
                  {formatOrderNo(order)}
                  <span className="font-normal text-slate-500"> · {order.item_count} ürün{formatPaymentMethod(order.payment_method) ? ` · ${formatPaymentMethod(order.payment_method)}` : ""}</span>
                </span>
                <span><StatusBadge status={order.status} isTekel={isTekel} /></span>
                <span className={cn("hidden text-right font-semibold tabular-nums md:block", order.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-900")}>{formatOrderTotal(order)}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </Card>
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
  categories = [],
}: {
  initialCustomers: Customer[];
  ordersEndpointBase?: string;
  isTekel?: boolean;
  categories?: Category[];
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
  const [deletePending, setDeletePending] = useState(false);

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
          body: JSON.stringify({ phone: customer.phone, reason: `Müşteri: ${customer.full_name}` }),
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

  async function deleteCustomer(customer: Customer) {
    setDeletePending(true);
    setError(null);
    const response = await fetch(`/api/tenant/customers/${customer.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Müşteri silinemedi.");
    } else {
      setCustomers((curr) => curr.filter((c) => c.id !== customer.id));
      setSelected(null);
    }
    setDeletePending(false);
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
    XLSX.utils.book_append_sheet(wb, ws, "Müşteriler");
    XLSX.writeFile(wb, `musteri-listesi-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          categories={categories}
          onDelete={(c) => void deleteCustomer(c)}
          deletePending={deletePending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InlineAlert tone="error" message={error} />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "Tümü"],
            ["active", "Son 30 gün"],
            ["quiet", "Sessizleşen"],
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
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad veya telefon" className="w-52 pl-9" />
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
          <div className="divide-y divide-slate-100">
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_90px_150px_130px_32px] items-center gap-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Müşteri</span><span>Son sipariş</span><span className="text-right">Sipariş</span><span className="text-right">Toplam alışveriş</span><span className="text-right">Bekleyen</span><span />
            </div>
            {visible.map((c) => {
              const pending = primaryAmount(c.pending_by_currency);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void open(c)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 text-left hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_140px_90px_150px_130px_32px]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {getInitials(c.full_name)}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                        {c.full_name}
                        {c.is_blocked ? <Badge variant="danger" className="px-1.5 py-0 text-[10px]">Engelli</Badge> : null}
                        {c.has_push ? <BellRing className="size-3.5 text-emerald-600" aria-label="Bildirim izni verdi" /> : null}
                        {c.magnet_code ? <Magnet className="size-3.5 text-sky-600" aria-label="Magnetli müşteri" /> : null}
                        {c.active_coupon ? <Gift className="size-3.5 text-amber-600" aria-label={`Aktif kupon: ${c.active_coupon.title}`} /> : null}
                      </span>
                      <span className="block text-xs text-slate-500">{c.phone}</span>
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums text-slate-900 md:hidden">{formatTotals(c.totals_by_currency)}</span>
                  <span className="col-span-2 text-xs text-slate-500 md:col-span-1 md:text-sm md:text-slate-600">{formatDate(c.last_order_at)}<span className="md:hidden"> · {c.orders_count} sipariş</span></span>
                  <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{c.orders_count}</span>
                  <span className="hidden text-right text-sm font-semibold tabular-nums text-slate-900 md:block">{formatTotals(c.totals_by_currency)}</span>
                  <span className={cn("hidden text-right text-sm tabular-nums md:block", pending > 0 ? "text-amber-700" : "text-slate-300")}>{pending > 0 ? formatTotals(c.pending_by_currency) : "—"}</span>
                  <ChevronRight className="hidden size-4 text-slate-300 md:block" />
                </button>
              );
            })}
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-500">
        {visible.length} müşteri · toplam alışveriş {formatTotals(kpis.totals)}{primaryAmount(kpis.pending) > 0 ? ` · bekleyen ${formatTotals(kpis.pending)}` : ""}. Toplamlar yalnız teslim edilen siparişleri kapsar.
      </p>
    </div>
  );
}
