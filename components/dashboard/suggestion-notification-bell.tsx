"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, PackageCheck } from "lucide-react";
import type { ProductSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

// "Önerdiğim Ürünler" sayfasının sağ üst köşesindeki bildirim zili.
// Süper admin bir öneriyi onayladığında ürün tenant'ın Ürünler sayfasına
// STOĞU KAPALI olarak düşer (bkz. admin approve route'u) — bu yüzden
// bildirime tıklamak kullanıcıyı doğrudan o ürüne götürüyor ki stoğu açsın.
export function SuggestionNotificationBell({
  notices,
}: {
  notices: ProductSuggestion[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Okundu işaretlenen bildirim anında listeden düşsün diye lokal kopya
  // tutuluyor; sunucudaki dismissed_at güncellemesi arka planda gidiyor.
  const [items, setItems] = useState(notices);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(notices);
  }, [notices]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const count = items.length;

  async function openProduct(notice: ProductSuggestion) {
    setItems((current) => current.filter((item) => item.id !== notice.id));
    setOpen(false);

    // Ürün listesi sunucu tarafında sayfalandığı için ürünün kaçıncı sayfada
    // olduğu bilinemez; barkodla arama yapılarak ilk sayfaya getiriliyor
    // (arama sku_code'u da kapsıyor), focus parametresi de satırı vurguluyor.
    const params = new URLSearchParams({ q: notice.barcode });
    if (notice.product_id) {
      params.set("focus", notice.product_id);
    }
    router.push(`/dashboard/products?${params.toString()}`);

    await fetch("/api/tenant/products/product-suggestions/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: notice.id }),
    }).catch(() => undefined);

    router.refresh();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={count ? `${count} yeni bildirim` : "Bildirimler"}
        aria-expanded={open}
        className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" />
        {count ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-card">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-2 shadow-lg">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bildirimler
          </p>

          {count ? (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {items.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => void openProduct(notice)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg p-3 text-left transition",
                    "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                  )}
                >
                  <PackageCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">
                      Önerdiğiniz{" "}
                      <strong className="font-semibold">{notice.product_name}</strong> ürünü
                      eklendi.
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Stok açmak için tıklayın →
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Yeni bildiriminiz yok.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
