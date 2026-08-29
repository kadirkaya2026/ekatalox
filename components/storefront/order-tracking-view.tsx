"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle, XCircle } from "lucide-react";
import {
  StorefrontThemeProvider,
  useStorefrontTheme,
  type StorefrontAppearanceSettings,
} from "@/lib/storefront/theme-context";
import { cn, formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { OrderStatus } from "@/lib/types";
import { getStatusDescription, getStatusLabel } from "@/lib/orders/status";
import { buildWhatsAppOrderHref } from "@/lib/storefront/whatsapp-order";
import { markSeen } from "@/lib/storefront/tracking-phone";
import { PushOptInBanner } from "@/components/storefront/push-opt-in-button";

export interface TrackingSnapshot {
  orderNumber: string;
  // 0093: bayi başına sıralı numara; yoksa orderNumber'ın son parçası gösterilir
  orderNo: number | null;
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

// Müşterinin mağazaya söyleyeceği kısa kod: "#100042". Uzun depolama kodu
// hiçbir yerde gösterilmez; order_no yoksa eski kodun son parçası ("N4MX").
function displayNo(snap: Pick<TrackingSnapshot, "orderNo" | "orderNumber">) {
  if (typeof snap.orderNo === "number") return `#${snap.orderNo}`;
  const parts = snap.orderNumber.split("_");
  return `#${(parts[parts.length - 1] ?? snap.orderNumber).toUpperCase()}`;
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

  // Bu sayfayı gören müşteri bu siparişin son durumunu görmüş sayılır
  // (başlıktaki kırmızı rozet buna göre düşer).
  useEffect(() => {
    markSeen([{ orderNo: snap.orderNo, statusUpdatedAt: snap.statusUpdatedAt }]);
  }, [snap.orderNo, snap.statusUpdatedAt]);

  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/storefront/order-tracking?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        setSnap((s) => ({ ...s, status: d.status, statusUpdatedAt: d.status_updated_at, cancelReason: d.cancel_reason ?? null, events: d.events ?? s.events }));
      } catch {
        // ağ hatası: sonraki turda tekrar
      }
    };
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [token]);

  const cancelled = snap.status === "cancelled";
  const activeIndex = STEPS.indexOf(snap.status);
  const waHref = buildWhatsAppOrderHref({
    phone: whatsappNumber,
    message: `Merhaba, ${displayNo(snap)} numaralı siparişim hakkında bilgi almak istiyorum.`,
    directToRegisteredNumber: true,
  });
  const text = theme.text;
  const muted = theme.textMuted;

  return (
    <div data-storefront className={cn(theme.page, "min-h-screen")}>
      <div className="container-shell flex items-start justify-center py-6">
      <div className={cn(theme.gateCard, "w-full max-w-lg")}>
        <p className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{tenantName}</p>
        <h1 className={cn("mt-1 text-2xl font-semibold", text)}>Sipariş {displayNo(snap)}</h1>
        <p className={cn("mt-1 text-sm", muted)}>
          {fmtTime(snap.createdAt)} · {snap.currency === "CATALOG" ? "Fiyatsız katalog siparişi" : formatCurrency(snap.totalAmount, snap.currency as CurrencyCode)}
        </p>

        {!cancelled && snap.status !== "delivered" ? (
          <PushOptInBanner token={token} vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
        ) : null}

        {cancelled ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-300/60 bg-rose-500/10 p-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
            <div>
              <p className={cn("font-semibold", text)}>Siparişiniz iptal edildi</p>
              {snap.cancelReason ? <p className={cn("mt-1 text-sm", muted)}>Sebep: {snap.cancelReason}</p> : null}
              <p className={cn("mt-1 text-xs", muted)}>{fmtTime(snap.statusUpdatedAt)}</p>
            </div>
          </div>
        ) : (
          <ol className="mt-6 space-y-4">
            {STEPS.map((step, i) => {
              const done = i < activeIndex;
              const current = i === activeIndex;
              const at = snap.events.filter((e) => e.status === step).at(-1)?.at;
              return (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                      done && "border-emerald-500 bg-emerald-500 text-white",
                      current && cn("border-emerald-500", text),
                      !done && !current && cn("border-current opacity-30", muted),
                    )}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <div className={done || current ? "" : "opacity-40"}>
                    <p className={cn("text-sm font-semibold", text)}>{getStatusLabel(step, { isTekel })}</p>
                    {current ? <p className={cn("text-sm", muted)}>{getStatusDescription(step, { isTekel })}</p> : null}
                    {at && (done || current) ? <p className={cn("text-xs", muted)}>{fmtTime(at)}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className={cn("mt-6 space-y-2 border-t pt-4", theme.border)}>
          {snap.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className={text}>
                {item.name}
                {item.variant ? <span className={muted}> · {item.variant}</span> : null}
                <span className={muted}> × {item.quantity} {item.unit ?? "adet"}</span>
              </span>
              {item.price !== null && snap.currency !== "CATALOG" ? (
                <span className={cn("font-medium", text)}>{formatCurrency(item.price * item.quantity, snap.currency as CurrencyCode)}</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold", theme.border, text)}
          >
            <MessageCircle className="size-4" />
            Mağazaya WhatsApp&apos;tan yaz
          </a>
          <p className={cn("text-center text-[11px]", muted)}>Bu sayfa durum değiştikçe kendiliğinden güncellenir.</p>
        </div>
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
