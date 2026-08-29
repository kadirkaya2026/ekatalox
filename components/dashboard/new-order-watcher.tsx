"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import type { OrdersPage } from "@/lib/orders/data";
import { formatOrderNo, formatOrderTotal } from "@/lib/orders/format";
import { playOrderRing } from "@/lib/dashboard/order-ring";

const POLL_MS = 15_000;

// Panelin HER sayfasında çalışır (layout'ta). 15 sn'de bir "yeni" sipariş
// sayısını yoklar; artmışsa ses + sağ altta uyarı kartı + kenar rozetini
// yeniler (router.refresh) + Siparişler sayfası açıksa listesini tazeler.
export function NewOrderWatcher({ initialNewCount }: { initialNewCount: number }) {
  const router = useRouter();
  const last = useRef(initialNewCount);
  const [toast, setToast] = useState<{ id: string; label: string; total: string } | null>(null);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/tenant/orders?status=new&page=1&pageSize=1", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as OrdersPage;
        const n = d.counts?.new ?? 0;
        if (!stopped && n > last.current) {
          playOrderRing();
          const o = d.orders[0];
          if (o) setToast({ id: o.id, label: `${formatOrderNo(o)} · ${o.customer_name}`, total: formatOrderTotal(o) });
          router.refresh();
          window.dispatchEvent(new Event("ekx-new-order"));
        }
        last.current = n;
      } catch {
        /* ağ hatası: sonraki turda */
      }
    };
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  if (!toast) return null;
  return (
    <div className="fixed bottom-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl md:bottom-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <ShoppingBag className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Yeni sipariş geldi</p>
          <p className="truncate text-sm text-slate-600">{toast.label} · {toast.total}</p>
          <a
            href={`/dashboard/siparisler?order=${toast.id}`}
            onClick={() => setToast(null)}
            className="mt-2 inline-flex h-9 items-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Siparişi aç
          </a>
        </div>
        <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700" aria-label="Kapat">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
