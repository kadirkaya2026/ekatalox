"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle, XCircle } from "lucide-react";
import {
  StorefrontThemeProvider,
  useStorefrontTheme,
  type StorefrontAppearanceSettings,
} from "@/lib/storefront/theme-context";
import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { OrderStatus } from "@/lib/types";
import { getStatusDescription, getStatusLabel } from "@/lib/orders/status";
import { buildWhatsAppOrderHref } from "@/lib/storefront/whatsapp-order";

export interface TrackingSnapshot {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  statusUpdatedAt: string;
  cancelReason: string | null;
  currency: string;
  totalAmount: number;
  items: Array<{ name: string; variant: string | null; quantity: number; unit: string | null; price: number | null }>;
  events: Array<{ status: OrderStatus; at: string }>;
}

const STEPS: OrderStatus[] = ["new", "confirmed", "preparing", "shipped", "delivered"];
const POLL_MS = 45_000;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function TrackingCard({
  token,
  tenantName,
  whatsappNumber,
  isTekel,
  initial,
}: {
  token: string;
  tenantName: string;
  whatsappNumber: string;
  isTekel: boolean;
  initial: TrackingSnapshot;
}) {
  const theme = useStorefrontTheme();
  const [snap, setSnap] = useState(initial);

  // Sessiz yenileme: sekme görünürken 45 sn'de bir; bayi durumu değiştirince
  // müşteri sayfayı yenilemeden görür.
  useEffect(() => {
    let timer: number | undefined;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/storefront/order-tracking?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        setSnap((s) => ({
          ...s,
          status: d.status,
          statusUpdatedAt: d.status_updated_at,
          cancelReason: d.cancel_reason ?? null,
          events: d.events ?? s.events,
        }));
      } catch {
        // ağ hatası: bir sonraki turda tekrar dener
      }
    };
    timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [token]);

  const cancelled = snap.status === "cancelled";
  const activeIndex = STEPS.indexOf(snap.status);
  const waHref = buildWhatsAppOrderHref({
    phone: whatsappNumber,
    message: `Merhaba, ${snap.orderNumber} numaralı siparişim hakkında bilgi almak istiyorum.`,
    directToRegisteredNumber: true,
  });

  return (
    <div data-storefront className="container-shell flex min-h-screen items-start justify-center py-8">
      <div className={`${theme.gateCard} w-full max-w-lg`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{tenantName}</p>
        <h1 className={theme.gateTitle}>Sipariş {snap.orderNumber}</h1>
        <p className={theme.gateDescription}>
          {fmtTime(snap.createdAt)} · {snap.currency === "CATALOG" ? "Fiyatsız katalog siparişi" : formatCurrency(snap.totalAmount, snap.currency as CurrencyCode)}
        </p>

        {cancelled ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <XCircle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Siparişiniz iptal edildi</p>
              {snap.cancelReason ? <p className="mt-1 text-sm">Sebep: {snap.cancelReason}</p> : null}
              <p className="mt-1 text-xs opacity-70">{fmtTime(snap.statusUpdatedAt)}</p>
            </div>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {STEPS.map((step, i) => {
              const done = i < activeIndex;
              const current = i === activeIndex;
              const at = snap.events.filter((e) => e.status === step).at(-1)?.at;
              return (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold " +
                      (done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : current
                          ? "border-emerald-600 text-emerald-700"
                          : "border-current opacity-30")
                    }
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <div className={done || current ? "" : "opacity-40"}>
                    <p className="text-sm font-semibold">{getStatusLabel(step, { isTekel })}</p>
                    {current ? <p className="text-sm opacity-80">{getStatusDescription(step, { isTekel })}</p> : null}
                    {at && (done || current) ? <p className="text-xs opacity-60">{fmtTime(at)}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 space-y-2 border-t border-current/10 pt-4">
          {snap.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <span>
                {item.name}
                {item.variant ? <span className="opacity-60"> · {item.variant}</span> : null}
                <span className="opacity-60"> × {item.quantity} {item.unit ?? "adet"}</span>
              </span>
              {item.price !== null && snap.currency !== "CATALOG" ? (
                <span className="font-medium">{formatCurrency(item.price * item.quantity, snap.currency as CurrencyCode)}</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-current px-5 text-sm font-semibold"
          >
            <MessageCircle className="size-4" />
            Mağazaya WhatsApp&apos;tan yaz
          </a>
          <p className="text-center text-xs opacity-60">Bu sayfa durum değiştikçe kendiliğinden güncellenir.</p>
        </div>
      </div>
    </div>
  );
}

export function OrderTrackingView(props: {
  token: string;
  tenantName: string;
  whatsappNumber: string;
  isTekel: boolean;
  appearance?: StorefrontAppearanceSettings;
  initial: TrackingSnapshot;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={props.appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={props.appearance?.brand_primary_color}
      brandAccentColor={props.appearance?.brand_accent_color}
    >
      <TrackingCard {...props} />
    </StorefrontThemeProvider>
  );
}
