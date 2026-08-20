"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, PackageCheck } from "lucide-react";
import {
  buildSuggestionProductHref,
  dismissAllSuggestionNotices,
  dismissSuggestionNotice,
  markSuggestionNoticesSeen,
} from "@/lib/products/suggestion-notice-actions";
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
  // Kapatılan bildirimlerin id'si tutuluyor; listeyi kopyalamak yerine
  // filtre uygulanıyor ki router.refresh() sonrası gelen (henüz güncellenmemiş)
  // notices prop'u kapatılan bildirimi geri diriltmesin.
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Sayaç "görüldü" ile sıfırlanıyor ama bildirimler listede kaldığı için
  // rozetin lokal olarak da sönmesi gerekiyor (sunucu sayısı router.refresh'e
  // kadar eski kalır).
  const [seen, setSeen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const seenSentRef = useRef(false);

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

  const items = notices.filter((notice) => !dismissedIds.includes(notice.id));
  // Rozet "görülmemiş" sayısını gösterir; liste uzunluğunu değil.
  const count = seen ? 0 : items.length;

  // Liste sonuna gelindiğinde (ya da liste zaten tamamen görünüyorsa, yani
  // kaydıracak bir şey yoksa) bildirimler görüldü sayılır.
  function markSeen() {
    if (seenSentRef.current) return;
    seenSentRef.current = true;
    setSeen(true);
    void markSuggestionNoticesSeen().then(() => router.refresh());
  }

  function handleListScroll() {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      markSeen();
    }
  }

  // Kaydırma çubuğu hiç çıkmıyorsa "sonuna kaydırma" olayı da hiç olmaz;
  // bu durumda liste açılır açılmaz görüldü sayılıyor.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 8) {
      markSeen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  async function clearAll() {
    if (clearingAll) return;
    setClearingAll(true);
    setDismissedIds(notices.map((notice) => notice.id));
    setSeen(true);
    seenSentRef.current = true;
    await dismissAllSuggestionNotices();
    router.refresh();
    setClearingAll(false);
    setOpen(false);
  }

  async function openProduct(notice: ProductSuggestion) {
    if (pendingId) {
      return;
    }

    setPendingId(notice.id);
    setDismissedIds((current) => [...current, notice.id]);
    seenSentRef.current = true;

    // Sıralama önemli: "okundu" kaydı ÖNCE sunucuya yazılıyor. Menüdeki
    // kırmızı rozet dashboard layout'unda sunucu tarafında sayılıyor
    // (getTenantSuggestionNoticeCount); önce yönlendirseydik hedef sayfa
    // bildirim hâlâ okunmamışken render edilir ve rozet eski sayıda kalırdı.
    await dismissSuggestionNotice(notice.id);

    // Menüdeki rozet /dashboard layout'unda sunucuda sayılıyor ve App
    // Router'da paylaşılan layout kardeş sayfalar arası yumuşak geçişte
    // YENİDEN RENDER EDİLMİYOR (partial rendering) — yani sadece push
    // etmek rozeti asla güncellemezdi. router.refresh() o anki route'un
    // Server Component'lerini layout'lar dahil yeniden render ettiği için
    // rozet daha sayfadan çıkmadan güncelleniyor; ardından gelen yumuşak
    // geçiş bu güncel layout'u koruyor.
    router.refresh();

    setPendingId(null);
    setOpen(false);
    router.push(buildSuggestionProductHref(notice));
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
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bildirimler
            </p>
            {items.length ? (
              <button
                type="button"
                onClick={() => void clearAll()}
                disabled={clearingAll || pendingId !== null}
                className="text-xs font-semibold text-muted-foreground underline underline-offset-2 transition hover:text-foreground disabled:opacity-50"
              >
                {clearingAll ? "Temizleniyor…" : "Tümünü temizle"}
              </button>
            ) : null}
          </div>

          {items.length ? (
            <div
              ref={listRef}
              onScroll={handleListScroll}
              className="max-h-80 space-y-1 overflow-y-auto"
            >
              {items.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  disabled={pendingId !== null}
                  onClick={() => void openProduct(notice)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg p-3 text-left transition",
                    "hover:bg-emerald-50 disabled:opacity-60 dark:hover:bg-emerald-900/20",
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
                      {pendingId === notice.id ? "Açılıyor…" : "Stok açmak için tıklayın →"}
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
