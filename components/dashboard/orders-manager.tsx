"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, NotebookText, Printer, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { OrderStatus, OrderStatusEvent, StorefrontOrder } from "@/lib/types";
import type { OrdersPage } from "@/lib/orders/data";
import { formatOrderTotal, formatPaymentMethod, formatOrderNo } from "@/lib/orders/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_TONES,
  getNextActions,
  getStatusLabel,
} from "@/lib/orders/status";
import { buildOrderStatusWhatsAppHref } from "@/lib/orders/whatsapp-status-message";

// "credit": durumdan bağımsız özel görünüm — açık veresiyeler.
type StatusFilter = OrderStatus | "all" | "credit";

function StatusBadge({ status, isTekel }: { status: OrderStatus; isTekel: boolean }) {
  return (
    <Badge className={cn("whitespace-nowrap px-2.5 py-0.5 text-[11px]", ORDER_STATUS_TONES[status])}>
      {getStatusLabel(status, { isTekel })}
    </Badge>
  );
}

// Takip linki vitrin host'unda yaşar; panelden kopyalanırken bayinin
// vitrin adresini bilmediğimiz için müşteri linki sipariş kaydında değil,
// WhatsApp mesajında taşınır. Burada yalnız gösterim için token'dan üretmek
// yerine sunucudan gelen tam URL beklenir (v1: mağaza alan adı ayarıyla).
function buildTrackingUrl(storefrontOrigin: string | null, token: string) {
  return storefrontOrigin ? `${storefrontOrigin}/siparis/${token}` : null;
}

export function OrdersManager({
  initialPage,
  tenantName,
  isTekel,
  storefrontOrigin = null,
}: {
  initialPage: OrdersPage;
  tenantName: string;
  isTekel: boolean;
  storefrontOrigin?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState<OrdersPage>(initialPage);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ order: StorefrontOrder; events: OrderStatusEvent[] } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [creditReminderPending, setCreditReminderPending] = useState<string | null>(null);
  const [creditMsg, setCreditMsg] = useState<string | null>(null);

  const load = useCallback(
    async (override?: Partial<{ status: StatusFilter; q: string; from: string; to: string; page: number }>) => {
      const s = override?.status ?? status;
      const params = new URLSearchParams({
        // "credit" özel görünüm: durum süzgeci uygulanmaz, açık veresiyeler gelir.
        status: s === "credit" ? "all" : s,
        page: String(override?.page ?? pageNo),
        pageSize: s === "credit" ? "50" : "25",
      });
      if (s === "credit") params.set("credit", "open");
      const qq = override?.q ?? q;
      const ff = override?.from ?? from;
      const tt = override?.to ?? to;
      if (qq.trim()) params.set("q", qq.trim());
      if (ff) params.set("from", ff);
      if (tt) params.set("to", tt);

      setLoading(true);
      setError(null);
      const response = await fetch(`/api/tenant/orders?${params.toString()}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Siparişler yüklenemedi.");
      } else {
        setPage(result as OrdersPage);
      }
      setLoading(false);
    },
    [status, q, from, to, pageNo],
  );

  // Bildirime dokununca /siparisler?order={id} açılır → sipariş doğrudan
  // onay ekranında. Parametre tüketilince URL temizlenir (geri tuşu kirlenmesin).
  const openedFromUrl = useRef<string | null>(null);
  useEffect(() => {
    const id = searchParams.get("order");
    if (!id || openedFromUrl.current === id) return;
    openedFromUrl.current = id;
    void (async () => {
      const response = await fetch(`/api/tenant/orders/${id}`);
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setSelected(result);
        setCancelOpen(false);
        setCancelReason("");
      } else {
        setError(result.error ?? "Sipariş bulunamadı.");
      }
      router.replace("/dashboard/siparisler");
    })();
  }, [searchParams, router]);

  // Yeni sipariş yoklaması panel genelinde (new-order-watcher.tsx); burada
  // yalnız olayı dinleyip listeyi tazeliyoruz.
  useEffect(() => {
    const onNew = () => { void load(); };
    window.addEventListener("ekx-new-order", onNew);
    return () => window.removeEventListener("ekx-new-order", onNew);
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    const fresh = page.orders.find((o) => o.id === selected.order.id);
    if (fresh) setSelected((curr) => (curr ? { ...curr, order: fresh } : curr));
  }, [page.orders, selected?.order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openOrder(order: StorefrontOrder, options?: { openCancel?: boolean }) {
    setError(null);
    const response = await fetch(`/api/tenant/orders/${order.id}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Sipariş açılamadı.");
      return;
    }
    setSelected(result);
    setCancelOpen(Boolean(options?.openCancel));
    setCancelReason("");
  }

  async function transition(order: StorefrontOrder, toStatus: OrderStatus, reason?: string) {
    setPending(order.id);
    setError(null);
    const response = await fetch(`/api/tenant/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_status: toStatus, reason }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Durum güncellenemedi.");
    } else {
      setCancelOpen(false);
      setCancelReason("");
      await load();
      if (selected?.order.id === order.id) await openOrder(order);
      router.refresh(); // kenar çubuğundaki "Yeni" rozeti
    }
    setPending(null);
  }

  async function creditAction(order: StorefrontOrder, action: "mark" | "unmark" | "paid") {
    setPending(order.id);
    setError(null);
    setCreditMsg(null);
    const response = await fetch(`/api/tenant/orders/${order.id}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Veresiye durumu güncellenemedi.");
    } else {
      await load();
      if (selected?.order.id === order.id) await openOrder(order);
    }
    setPending(null);
  }

  async function sendCreditReminder(customerId: string) {
    setCreditReminderPending(customerId);
    setCreditMsg(null);
    setError(null);
    const response = await fetch("/api/tenant/orders/credit-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Bildirim gönderilemedi.");
    } else if (result.sent > 0) {
      setCreditMsg(`Tahsilat bildirimi gönderildi (${result.sent} cihaz, ${result.totalLabel}).`);
    } else {
      setCreditMsg(
        "Bu müşterinin bildirim aboneliği yok — müşteri sipariş takip sayfasından bildirimleri açarsa gönderilebilir.",
      );
    }
    setCreditReminderPending(null);
  }

  const pageCount = Math.max(1, Math.ceil(page.total / page.pageSize));

  if (selected) {
    const order = selected.order;
    const trackingUrl = buildTrackingUrl(storefrontOrigin, order.tracking_token);
    const next = getNextActions(order.status);
    const primaryNext = next[0];
    const otherNext = next.slice(1);
    const actionLabel = (s: OrderStatus) => {
      switch (s) {
        case "confirmed": return "Siparişi onayla";
        case "preparing": return "Hazırlanıyor";
        case "shipped": return isTekel ? "Hazır, teslim alınabilir" : "Yola çıktı";
        case "delivered": return "Teslim edildi";
        default: return getStatusLabel(s, { isTekel });
      }
    };
    const payment = formatPaymentMethod(order.payment_method);
    return (
      <Card className="overflow-hidden p-0">
        {/* Üst şerit: geri + araçlar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="group -ml-2 flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
            Siparişler
          </button>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <a href={`/yazdir/siparis/${order.id}`} target="_blank" rel="noreferrer" title="Fiş yazıcısından yazdır">
                <Printer className="size-4" />
                Yazdır
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a
                href={buildOrderStatusWhatsAppHref({ order, status: order.status, tenantName, isTekel, trackingUrl })}
                target="_blank"
                rel="noreferrer"
                title="Müşteriye WhatsApp'tan durum mesajı gönder"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <InlineAlert tone="error" message={error} />

          {/* Kimlik */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{formatOrderNo(order)}</h3>
                <StatusBadge status={order.status} isTekel={isTekel} />
              </div>
              <p className="mt-1 text-sm text-slate-500">{formatDate(order.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatOrderTotal(order)}</p>
              {payment ? <p className="text-sm text-slate-500">{payment}</p> : null}
            </div>
          </div>

          {/* Müşteri */}
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">{order.customer_name}</p>
            <a href={`tel:${order.customer_phone}`} className="text-slate-700 hover:underline">{order.customer_phone}</a>
            {order.customer_address ? <p className="mt-0.5 text-slate-600">{order.customer_address}</p> : null}
            {order.note ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                <span className="font-semibold">Müşteri notu: </span>{order.note}
              </p>
            ) : null}
            {order.magnet_code ? (
              <p
                className={`mt-2 rounded-lg px-3 py-2 ${
                  order.magnet_mismatch ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                <span className="font-semibold">Magnet: </span>
                {order.magnet_code.toUpperCase()}
                {order.magnet_mismatch ? (
                  <>
                    {" — "}⚠ magnetin tanımlı sahibi
                    {order.magnet_owner_name ? ` ${order.magnet_owner_name}` : ""}, siparişi veren
                    farklı bir kişi. Teyit edin; gerekirse Magnetler sayfasından bu magneti pasife
                    alabilirsiniz.
                  </>
                ) : null}
              </p>
            ) : null}
          </div>

          {/* Ürünler */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {order.items.map((item, index) => (
              <div
                key={`${order.id}-${index}`}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-b-0"
              >
                <p className="text-slate-900">
                  <span className="mr-2 inline-block min-w-8 font-semibold tabular-nums">{item.quantity}×</span>
                  {item.product_name}
                  {item.variant_name ? <span className="text-slate-500"> · {item.variant_name}</span> : null}
                  {item.sales_unit && item.sales_unit !== "adet" ? <span className="text-slate-500"> · {item.sales_unit}</span> : null}
                </p>
                {item.price !== null ? (
                  <p className="shrink-0 font-medium tabular-nums text-slate-700">
                    {formatCurrency(item.price * item.quantity, item.currency as CurrencyCode)}
                  </p>
                ) : null}
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 text-sm">
              <span className="font-semibold text-slate-700">Toplam · {order.item_count} ürün</span>
              <span className="font-semibold tabular-nums text-slate-900">{formatOrderTotal(order)}</span>
            </div>
          </div>

          {/* Veresiye: tekel/market açık hesabı */}
          {order.credit_marked_at && !order.credit_paid_at ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-1.5 font-semibold text-red-800">
                  <NotebookText className="size-4 shrink-0 text-red-600" />
                  Veresiye — tahsil edilmedi
                  <span className="font-normal text-red-600">({formatDate(order.credit_marked_at)})</span>
                </p>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={pending === order.id} onClick={() => void creditAction(order, "paid")}>
                    Tahsil edildi
                  </Button>
                  <Button
                    disabled={!order.customer_id || creditReminderPending === order.customer_id}
                    onClick={() => order.customer_id && void sendCreditReminder(order.customer_id)}
                    title="Bildirimi açık olan müşterinin cihazına toplam borç hatırlatması gönderir"
                  >
                    {creditReminderPending === order.customer_id ? <Loader2 className="size-4 animate-spin" /> : null}
                    Tahsilat bildirimi gönder
                  </Button>
                  <Button variant="ghost" disabled={pending === order.id} onClick={() => void creditAction(order, "unmark")}>
                    İşareti kaldır
                  </Button>
                </div>
              </div>
              {creditMsg ? <p className="mt-2 text-xs font-medium text-red-700">{creditMsg}</p> : null}
            </div>
          ) : order.credit_paid_at ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <NotebookText className="size-4 shrink-0" />
              Veresiye tahsil edildi · {formatDate(order.credit_paid_at)}
            </div>
          ) : order.status !== "cancelled" ? (
            <button
              type="button"
              disabled={pending === order.id}
              onClick={() => void creditAction(order, "mark")}
              className="inline-flex items-center gap-1.5 text-left text-sm font-medium text-red-700 hover:underline"
            >
              <NotebookText className="size-4 shrink-0" />
              Veresiye olarak işaretle
            </button>
          ) : null}

          {/* Ne yapmalı? — tek net adım */}
          {order.status === "cancelled" ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">Sipariş iptal edildi</p>
              {order.cancel_reason ? <p className="mt-0.5">Sebep: {order.cancel_reason}</p> : null}
            </div>
          ) : order.status === "delivered" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              ✓ Teslim edildi · {order.delivered_at ? formatDate(order.delivered_at) : ""}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {primaryNext ? (
                  <Button
                    disabled={pending === order.id}
                    onClick={() => void transition(order, primaryNext)}
                    className="h-11 px-6 text-base"
                  >
                    {pending === order.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    {actionLabel(primaryNext)}
                  </Button>
                ) : null}
                {otherNext.map((s) => (
                  <Button key={s} variant="secondary" disabled={pending === order.id} onClick={() => void transition(order, s)}>
                    {actionLabel(s)}
                  </Button>
                ))}
                <button
                  type="button"
                  disabled={pending === order.id}
                  onClick={() => setCancelOpen((v) => !v)}
                  className="ml-auto text-sm font-medium text-rose-600 hover:underline"
                >
                  İptal et
                </button>
              </div>

              {cancelOpen ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <p className="text-sm font-semibold text-rose-800">Siparişi iptal et</p>
                  <p className="mt-1 text-xs text-rose-700">Sebep müşteriye gösterilir; kısa ve net yazın.</p>
                  <Textarea
                    className="mt-2"
                    rows={2}
                    value={cancelReason}
                    placeholder="Örn: Ürün stokta kalmadı"
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="danger"
                      disabled={pending === order.id || cancelReason.trim().length < 3}
                      onClick={() => void transition(order, "cancelled", cancelReason.trim())}
                    >
                      İptali onayla
                    </Button>
                    <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                      Vazgeç
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <InlineAlert tone="error" message={error} />

      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...ORDER_STATUSES] as (OrderStatus | "all")[]).filter((key) => key === "all" || key === status || (page.counts[key] ?? 0) > 0).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setStatus(key);
              setPageNo(1);
              void load({ status: key, page: 1 });
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold",
              status === key ? "bg-foreground text-background" : "border text-muted-foreground",
            )}
          >
            {key === "all" ? "Tümü" : getStatusLabel(key, { isTekel })} ({page.counts[key] ?? 0})
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setStatus("credit");
            setPageNo(1);
            void load({ status: "credit", page: 1 });
          }}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold",
            status === "credit" ? "bg-red-600 text-white" : "border border-red-200 text-red-700",
          )}
        >
          <NotebookText className="size-4 shrink-0" />
          Veresiye ({page.creditOpenCount ?? 0})
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <Input
            value={q}
            placeholder="Sipariş no, ad veya telefon"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPageNo(1);
                void load({ page: 1 });
              }
            }}
          />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        <Button
          variant="secondary"
          onClick={() => {
            setPageNo(1);
            void load({ page: 1 });
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Süz
        </Button>
      </div>

      {status === "credit" && page.orders.length ? (
        <Card className="border-red-200 bg-red-50/40 p-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-800">
            <NotebookText className="size-4 shrink-0 text-red-600" />
            Müşteri bazında açık veresiye
          </p>
          <p className="mt-0.5 text-xs text-red-600">
            Tahsilat bildirimi, sipariş takip sayfasından bildirimleri açmış müşterilerin cihazına gider.
          </p>
          {creditMsg ? <p className="mt-2 text-xs font-medium text-emerald-700">{creditMsg}</p> : null}
          <div className="mt-3 divide-y divide-red-100 rounded-xl border border-red-200 bg-white">
            {(() => {
              const groups = new Map<
                string,
                { name: string; phone: string; customerId: string | null; count: number; total: number; currency: string }
              >();
              for (const o of page.orders) {
                const key = o.customer_phone || o.id;
                const g =
                  groups.get(key) ??
                  { name: o.customer_name, phone: o.customer_phone, customerId: o.customer_id, count: 0, total: 0, currency: o.currency };
                g.count += 1;
                if (o.currency === g.currency) g.total += o.total_amount;
                if (!g.customerId && o.customer_id) g.customerId = o.customer_id;
                groups.set(key, g);
              }
              return [...groups.values()]
                .sort((a, b) => b.total - a.total)
                .map((g) => (
                  <div key={g.phone} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{g.name}</p>
                      <p className="text-xs text-slate-500">{g.phone} · {g.count} sipariş</p>
                    </div>
                    <span className="ml-auto font-semibold tabular-nums text-red-700">
                      {g.currency === "CATALOG" ? "—" : formatCurrency(g.total, g.currency as CurrencyCode)}
                    </span>
                    <Button
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      disabled={!g.customerId || creditReminderPending === g.customerId}
                      onClick={() => g.customerId && void sendCreditReminder(g.customerId)}
                    >
                      {creditReminderPending === g.customerId ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Tahsilat bildirimi
                    </Button>
                  </div>
                ));
            })()}
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        {page.orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">Bu süzgeçte sipariş yok.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden grid-cols-[200px_minmax(0,1fr)_120px_110px_170px_44px] items-center gap-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Sipariş</span><span>Müşteri</span><span>Tarih</span><span className="text-right">Tutar</span><span>İşlem</span><span />
            </div>
            {page.orders.map((order) => {
              const next = getNextActions(order.status)[0];
              const nextLabel = next
                ? next === "confirmed" ? "Onayla"
                  : next === "preparing" ? "Hazırlanıyor"
                  : next === "shipped" ? (isTekel ? "Hazır" : "Yola çıktı")
                  : "Teslim edildi"
                : null;
              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[200px_minmax(0,1fr)_120px_110px_170px_44px]"
                >
                  <button type="button" onClick={() => void openOrder(order)} className="flex items-center gap-2 text-left">
                    <span className="text-sm font-semibold text-slate-900">{formatOrderNo(order)}</span>
                    <StatusBadge status={order.status} isTekel={isTekel} />
                    {order.credit_marked_at && !order.credit_paid_at ? (
                      // Veresiye defteri: çerçevesiz, sadece kırmızı defter
                      // ikonu (kullanıcı isteği, 1 Eyl 2026) — dar sütuna
                      // sığar, metinlerin üstüne taşmaz.
                      <NotebookText
                        className="size-4 shrink-0 text-red-600"
                        aria-label="Veresiye — tahsil edilmedi"
                      />
                    ) : null}
                  </button>
                  <span className="text-right text-sm font-semibold tabular-nums text-slate-900 md:hidden">{formatOrderTotal(order)}</span>
                  <button type="button" onClick={() => void openOrder(order)} className="col-span-2 min-w-0 truncate text-left text-sm text-slate-700 hover:underline md:col-span-1">
                    {order.customer_name} <span className="text-slate-400">· {order.customer_phone}</span>
                    {order.magnet_mismatch ? (
                      <span
                        className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                        title="Sipariş, magnetin tanımlı sahibinden farklı bir kişiden geldi — teyit edin"
                      >
                        ⚠ magnet farklı kişi
                      </span>
                    ) : null}
                  </button>
                  <span className="hidden text-sm text-slate-500 md:block">{formatDate(order.created_at)}</span>
                  <span className="hidden text-right text-sm font-semibold tabular-nums text-slate-900 md:block">{formatOrderTotal(order)}</span>
                  <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                    {next && nextLabel ? (
                      <Button
                        variant={next === "delivered" ? "primary" : "secondary"}
                        disabled={pending === order.id}
                        onClick={() => void transition(order, next)}
                        className="h-9 w-full justify-center md:w-auto"
                      >
                        {pending === order.id ? <Loader2 className="size-4 animate-spin" /> : null}
                        {nextLabel}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 md:pl-1">{order.status === "cancelled" ? "İptal edildi" : "Tamamlandı"}</span>
                    )}
                  </div>
                  <a
                    href={`/yazdir/siparis/${order.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Fişi yazdır"
                    className="hidden size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:inline-flex"
                  >
                    <Printer className="size-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">
            Toplam {page.total} sipariş · sayfa {page.page} / {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page.page <= 1 || loading}
              onClick={() => {
                setPageNo(page.page - 1);
                void load({ page: page.page - 1 });
              }}
            >
              Önceki
            </Button>
            <Button
              variant="secondary"
              disabled={page.page >= pageCount || loading}
              onClick={() => {
                setPageNo(page.page + 1);
                void load({ page: page.page + 1 });
              }}
            >
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
