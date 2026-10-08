"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Hand, ShoppingCart } from "lucide-react";

// Belirgin gezinme işaretleri (8 Eki 2026, İsego isteği; beğenilirse tüm
// mağazalara açılacak — bkz. hasEnhancedNavCues): kalın "Daha fazla ürün
// göster" düğmesi ve kategori şeridinin kaydırılabildiğini gösteren oklar +
// ilk girişte bir kez "kaydırın" ipucu.

const HINT_STORAGE_PREFIX = "ekx-kategori-kaydir-ipucu-";

export function ProminentLoadMoreButton({
  remaining,
  loading,
  onClick,
}: {
  remaining: number;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group relative flex w-full max-w-md items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#ff3d1f] via-[#f2371b] to-[#e1262d] p-2.5 text-left text-white shadow-[0_10px_28px_-8px_rgba(230,40,30,0.75)] ring-1 ring-white/25 transition active:scale-[0.98] disabled:opacity-70"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/15" aria-hidden />
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-black/15 ring-1 ring-white/30">
        <ShoppingCart className="size-6" strokeWidth={2.4} />
      </span>
      <span className="relative min-w-0 flex-1 text-center">
        <span className="block whitespace-nowrap text-[15px] font-black uppercase leading-tight tracking-tight min-[400px]:text-base sm:text-lg">
          {loading ? (
            "Yükleniyor…"
          ) : (
            <>
              Daha fazla ürün <span className="text-[#ffd84d]">göster</span>
            </>
          )}
        </span>
        {!loading ? (
          <span className="mt-0.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#ffe9a8]">
            <span className="h-px w-5 bg-white/60" aria-hidden />
            {remaining} ürün daha var
            <span className="h-px w-5 bg-white/60" aria-hidden />
          </span>
        ) : null}
      </span>
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#e7302a] shadow transition group-hover:translate-x-0.5">
        <ChevronRight className="size-6" strokeWidth={3} />
      </span>
    </button>
  );
}

/**
 * Yatay kaydırılan kategori şeridi: kaydırılacak taraf varsa kenarda solma +
 * ok düğmesi; ilk girişte bir kez sağa-sola giden el ve "Kategoriler için
 * kaydırın" baloncuğu (kaydırınca ya da ~4,5 sn sonra kaybolur, tekrar çıkmaz).
 */
export function CategoryScrollFrame({
  enabled,
  className,
  storageKey,
  children,
}: {
  enabled: boolean;
  className: string;
  /** Mağazaya özel ipucu anahtarı (subdomain). */
  storageKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(measure);
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [enabled, measure]);

  // İlk giriş ipucu: yalnız kaydırılacak içerik varsa ve daha önce gösterilmediyse.
  useEffect(() => {
    if (!enabled || !canRight) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(HINT_STORAGE_PREFIX + storageKey) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const show = window.setTimeout(() => setShowHint(true), 600);
    const hide = window.setTimeout(() => setShowHint(false), 5100);
    try {
      window.localStorage.setItem(HINT_STORAGE_PREFIX + storageKey, "1");
    } catch {
      // Depolama kapalıysa ipucu her girişte bir kez görünür.
    }
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [enabled, canRight, storageKey]);

  const nudge = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="relative">
      {/* Kenar solması maskeyle: açık/koyu temada arka plana boya atmadan çalışır. */}
      <div
        ref={ref}
        className={className}
        onTouchStart={() => setShowHint(false)}
        style={{
          maskImage: `linear-gradient(to right, ${canLeft ? "transparent 0, #000 44px" : "#000 0"}, ${canRight ? "#000 calc(100% - 44px), transparent 100%" : "#000 100%"})`,
          WebkitMaskImage: `linear-gradient(to right, ${canLeft ? "transparent 0, #000 44px" : "#000 0"}, ${canRight ? "#000 calc(100% - 44px), transparent 100%" : "#000 100%"})`,
        }}
      >
        {children}
      </div>

      {canLeft ? (
        <div className="pointer-events-none absolute inset-y-0 -left-3 flex items-center">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Kategorileri sola kaydır"
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-[#f2371b] text-white shadow-md"
          >
            <ChevronLeft className="size-4" strokeWidth={3} />
          </button>
        </div>
      ) : null}
      {canRight ? (
        <div className="pointer-events-none absolute inset-y-0 -right-3 flex items-center">
          <motion.button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Kategorileri sağa kaydır"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-[#f2371b] text-white shadow-md"
          >
            <ChevronRight className="size-4" strokeWidth={3} />
          </motion.button>
        </div>
      ) : null}

      <AnimatePresence>
        {showHint ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-x-0 top-full z-30 flex justify-center"
            aria-hidden
          >
            <div className="-mt-2 flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#f2371b]">
                <motion.span animate={{ x: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                  <ChevronLeft className="size-6" strokeWidth={3} />
                </motion.span>
                <motion.span
                  animate={{ x: [-16, 16, -16] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="flex size-11 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-[#f2371b]/30"
                >
                  <Hand className="size-6 text-[#f2371b]" strokeWidth={2.2} />
                </motion.span>
                <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                  <ChevronRight className="size-6" strokeWidth={3} />
                </motion.span>
              </div>
              <span className="mt-1.5 rounded-full bg-[#f2371b] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
                Kategoriler için kaydırın
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
