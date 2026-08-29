"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Copy, Loader2, MessageCircle, Search, XCircle } from "lucide-react";
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
  isTerminalStatus,
} from "@/lib/orders/status";
import { buildOrderStatusWhatsAppHref } from "@/lib/orders/whatsapp-status-message";

type StatusFilter = OrderStatus | "all";

function StatusBadge({ status, isTekel }: { status: OrderStatus; isTekel: boolean }) {
  return (
    <Badge className={cn("px-2.5 py-0.5 text-[11px]", ORDER_STATUS_TONES[status])}>
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

  const load = useCallback(
    async (override?: Partial<{ status: StatusFilter; q: string; from: string; to: string; page: number }>) => {
      const s = override?.status ?? status;
      const params = new URLSearchParams({
        status: s,
        page: String(override?.page ?? pageNo),
        pageSize: "25",
      });
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

  const pageCount = Math.max(1, Math.ceil(page.total / page.pageSize));

  if (selected) {
    const order = selected.order;
    const trackingUrl = buildTrackingUrl(storefrontOrigin, order.tracking_token);
    const next = getNextActions(order.status);
    return (
      <Card className="p-5">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="group mb-4 -ml-2 flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Siparişlere dön
        </button>

        <InlineAlert tone="error" message={error} className="mb-4" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{formatOrderNo(order)}</h3>
            <StatusBadge status={order.status} isTekel={isTekel} />
          </div>
          <span className="text-sm text-slate-500">{formatDate(order.created_at)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{formatOrderTotal(order)}</span>
          {formatPaymentMethod(order.payment_method) ? (
            <>
              <span className="text-slate-300">•</span>
              <span>{formatPaymentMethod(order.payment_method)}</span>
            </>
          ) : null}
          {order.cost_missing_count > 0 ? (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700">{order.cost_missing_count} kalemde alış fiyatı yok</span>
            </>
          ) : order.cost_total !== null && order.currency !== "CATALOG" ? (
            <>
              <span className="text-slate-300">•</span>
              <span>
                Kâr:{" "}
                {formatCurrency(order.total_amount - order.cost_total, order.currency as CurrencyCode)}
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{order.customer_name}</p>
          <p>{order.customer_phone}</p>
          {order.customer_address ? <p className="text-slate-500">{order.customer_address}</p> : null}
          {order.note ? (
            <p className="mt-2 text-slate-600">
              <span className="font-medium text-slate-700">Not: </span>
              {order.note}
            </p>
          ) : null}
        </div>

        {/* Durum aksiyonları */}
        {!isTerminalStatus(order.status) ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {next.map((s) => (
              <Button
                key={s}
                disabled={pending === order.id}
                onClick={() => void transition(order, s)}
                variant={s === "delivered" ? "primary" : "secondary"}
              >
                {pending === order.id ? <Loader2 className="size-4 animate-spin" /> : null}
                {getStatusLabel(s, { isTekel })}
              </Button>
            ))}
            <Button
              variant="ghost"
              disabled={pending === order.id}
              onClick={() => setCancelOpen((v) => !v)}
              className="text-rose-600"
            >
              <XCircle className="size-4" />
              İptal et
            </Button>
          </div>
        ) : order.status === "cancelled" && order.cancel_reason ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            İptal sebebi: {order.cancel_reason}
          </p>
        ) : null}

        {cancelOpen ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
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

        {/* Müşteriyi bilgilendir */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary">
            <a
              href={buildOrderStatusWhatsAppHref({ order, status: order.status, tenantName, isTekel, trackingUrl })}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" />
              WhatsApp ile bilgilendir
            </a>
          </Button>
          {trackingUrl ? (
            <Button
              variant="ghost"
              onClick={() => void navigator.clipboard.writeText(trackingUrl)}
              title="Müşteri takip linkini kopyala"
            >
              <Copy className="size-4" />
              Takip linkini kopyala
            </Button>
          ) : null}
        </div>

        {/* Kalemler */}
        <div className="mt-4 space-y-2">
          {order.items.map((item, index) => (
            <div
              key={`${order.id}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {item.product_name}
                  {item.variant_name ? <span className="text-slate-500"> · {item.variant_name}</span> : null}
                </p>
                <p className="text-slate-500">
                  {item.quantity} {item.sales_unit ?? "adet"}
                  {item.unit_cost === null || item.unit_cost === undefined ? (
                    <span className="ml-2 text-amber-700">maliyet yok</span>
                  ) : null}
                </p>
              </div>
              {item.price !== null ? (
                <p className="font-medium text-slate-700">
                  {formatCurrency(item.price * item.quantity, item.currency as CurrencyCode)}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Zaman çizelgesi */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Geçmiş</p>
          <ol className="mt-2 space-y-1.5 text-sm">
            {selected.events.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-center gap-2 text-slate-600">
                <span className="text-xs text-slate-400">{new Date(ev.created_at).toLocaleString("tr-TR")}</span>
                <StatusBadge status={ev.to_status} isTekel={isTekel} />
                {ev.reason && ev.reason !== "legacy-backfill" ? <span className="text-slate-500">{ev.reason}</span> : null}
                <span className="text-xs text-slate-400">
                  {ev.actor === "dealer" ? "siz" : ev.actor === "customer" ? "müşteri" : "sistem"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <InlineAlert tone="error" message={error} />

      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...ORDER_STATUSES] as StatusFilter[]).map((key) => (
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

      <Card className="overflow-hidden p-0">
        {page.orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">Bu süzgeçte sipariş yok.</p>
        ) : (
          <div className="divide-y">
            {page.orders.map((order) => {
              const next = getNextActions(order.status)[0];
              return (
                <div key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void openOrder(order)}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        {formatOrderNo(order)}
                        <StatusBadge status={order.status} isTekel={isTekel} />
                        {order.cost_missing_count > 0 && order.currency !== "CATALOG" ? (
                          <span className="text-[11px] font-medium text-amber-700">maliyet eksik</span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-slate-600">
                        {order.customer_name} · {order.customer_phone} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <span className="text-sm font-semibold text-slate-900">{formatOrderTotal(order)}</span>
                  {next ? (
                    <Button
                      variant={next === "delivered" ? "primary" : "secondary"}
                      disabled={pending === order.id}
                      onClick={() => void transition(order, next)}
                    >
                      {pending === order.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {getStatusLabel(next, { isTekel })}
                    </Button>
                  ) : null}
                  {order.status !== "cancelled" ? (
                    <Button
                      variant="ghost"
                      disabled={pending === order.id}
                      onClick={() => void openOrder(order, { openCancel: true })}
                      className="text-rose-600"
                      title="Siparişi iptal et"
                    >
                      <XCircle className="size-4" />
                      İptal
                    </Button>
                  ) : null}
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
