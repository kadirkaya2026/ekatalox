"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Clock3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StorefrontOrder } from "@/lib/types";

// Sipariş detayında BizimHesap aktarım durumu (0159/0166): aktarıldı, hata
// (sebep + tekrar gönder) ya da onay bekliyor. Onaydan sonraki aktarım sunucuda
// arka planda olduğu için durum birkaç saniye sonra bir kez yeniden okunur.

type BizimHesapFields = {
  bizimhesap_guid?: string | null;
  bizimhesap_error?: string | null;
  bizimhesap_sent_at?: string | null;
};

export function OrderBizimHesapStrip({
  order,
  sendOn,
  onOrderUpdated,
  onSend,
}: {
  order: StorefrontOrder & BizimHesapFields;
  sendOn: "order" | "confirmed";
  onOrderUpdated: (order: StorefrontOrder) => void;
  /** Verilirse gönder düğmeleri cari/ürün seçilen onay penceresini açar (doğrudan göndermez). */
  onSend?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sent = Boolean(order.bizimhesap_guid);
  const failed = !sent && Boolean(order.bizimhesap_error);
  const waitingForApproval = !sent && !failed && sendOn === "confirmed" && order.status === "new";
  const pending = !sent && !failed && !waitingForApproval && order.status !== "cancelled";
  // Arka plan aktarımı birkaç saniye sürer; 1 dakikadan eski ve hâlâ gitmemişse
  // "aktarılıyor" yerine açıkça "gönderilmedi" denir (10 Eki 2026: yayın
  // kesintisinde onaylanan siparişler sonsuz "aktarılıyor"da kalmıştı).
  const startedAt = sendOn === "confirmed" ? order.confirmed_at : order.created_at;
  const [now, setNow] = useState(() => Date.now());
  const stale = pending && (!startedAt || now - new Date(startedAt).getTime() > 60_000);

  // Pencere açıkken 1 dakika dolarsa "gönderilmedi"ye geçsin.
  useEffect(() => {
    if (!pending || stale) return;
    const timer = window.setTimeout(() => setNow(Date.now()), 61_000);
    return () => window.clearTimeout(timer);
  }, [pending, stale]);

  async function refresh() {
    const response = await fetch(`/api/tenant/orders/${order.id}`, { cache: "no-store" });
    if (!response.ok) return;
    const json = await response.json();
    if (json?.order) onOrderUpdated(json.order as StorefrontOrder);
  }

  // Onaydan hemen sonra aktarım arka planda sürer: 4 sn sonra bir kez yenile.
  useEffect(() => {
    if (!pending || stale) return;
    const timer = window.setTimeout(() => void refresh(), 4000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, order.id]);

  async function resend() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/tenant/orders/${order.id}/bizimhesap`, { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) setMessage(json.error ?? "Gönderilemedi.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (order.status === "cancelled" && !sent) return null;

  if (sent) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
        <CheckCircle2 className="size-4" />
        BizimHesap&apos;a taslak olarak aktarıldı
        {order.bizimhesap_sent_at ? (
          <span className="text-emerald-700/80">
            · {new Date(order.bizimhesap_sent_at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
          </span>
        ) : null}
      </div>
    );
  }

  if (failed) {
    const needsMapping = /eşleşmeyen ürün/i.test(order.bizimhesap_error ?? "");
    return (
      <div className="flex flex-col gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800 md:flex-row md:items-center md:justify-between">
        <p className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">BizimHesap&apos;a aktarılamadı:</span> {order.bizimhesap_error}
            {message ? <span className="block text-rose-700">{message}</span> : null}
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          {needsMapping ? (
            <Button asChild variant="secondary">
              <a href="/products/bizimhesap">Ürünleri eşleştir</a>
            </Button>
          ) : null}
          <Button onClick={() => (onSend ? onSend() : void resend())} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Tekrar gönder
          </Button>
        </div>
      </div>
    );
  }

  if (waitingForApproval) {
    return (
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
        <Clock3 className="size-4" /> Siparişi onayladığınızda BizimHesap&apos;a taslak olarak aktarılacak.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <span className="flex items-center gap-2">
        {stale ? (
          <>
            <CircleAlert className="size-4" /> BizimHesap&apos;a gönderilmedi.
          </>
        ) : (
          <>
            <Loader2 className="size-4 animate-spin" /> BizimHesap&apos;a aktarılıyor…
          </>
        )}
        {message ? <span className="text-amber-900">{message}</span> : null}
      </span>
      <Button variant={stale ? "primary" : "secondary"} onClick={() => (onSend ? onSend() : void resend())} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        {stale ? "BizimHesap'a gönder" : "Şimdi gönder"}
      </Button>
    </div>
  );
}
