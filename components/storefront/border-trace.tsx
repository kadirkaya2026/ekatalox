"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BorderTraceHandle {
  /** Çizgi çevreyi bir tur dolanır ve KALIR (ilk sepete ekleme). */
  show: () => void;
  /** Çizgi geri sarılarak kaybolur (adet sıfıra düşünce). */
  hide: () => void;
}

/**
 * Getir tarzı "çevreyi dolanan çizgi" efekti (animated border trace).
 *
 * Kapsayıcıyı (relative olmalı) dolduran bir SVG rect çizer.
 * show(): stroke-dashoffset 100→0 — çizgi köşeden başlayıp çevreyi
 * ~yarım saniyede dolanır ve KALICI çerçeve olarak kalır.
 * hide(): 0→100 — aynı çizgi geri sarılarak kaybolur.
 * pathLength={100} numarası sayesinde gerçek çevre uzunluğunu ölçmeye
 * gerek yok — her boyutta aynı süre/oran çalışır.
 *
 * Renk currentColor'dan gelir: className ile text-* verin (ör. bayinin
 * + butonu rengi — text-[var(--brand-primary)] ya da tema accent'i).
 * Sayfa, ürün zaten sepetteyken açıldıysa defaultVisible ile çizgi
 * animasyonsuz görünür başlatılır.
 */
export const BorderTrace = forwardRef<
  BorderTraceHandle,
  {
    className?: string;
    /** Kapsayıcının border-radius'u (px) — çizgi köşeleri buna oturur. */
    radius?: number;
    strokeWidth?: number;
    /** Çizginin çevreyi dolanma/geri sarılma süresi (sn). Getir hissi: 0.4–0.6. */
    duration?: number;
    /** İlk render'da çizgi görünür başlasın mı (ürün zaten sepetteyse). */
    defaultVisible?: boolean;
  }
>(function BorderTrace(
  { className, radius = 19, strokeWidth = 2.5, duration = 0.5, defaultVisible = false },
  ref,
) {
  const controls = useAnimationControls();

  useImperativeHandle(
    ref,
    () => ({
      show() {
        void controls.start({
          opacity: 1,
          strokeDashoffset: [100, 0],
          transition: { duration, ease: "easeInOut" },
        });
      },
      hide() {
        void controls.start({
          opacity: 1,
          strokeDashoffset: [0, 100],
          transition: { duration, ease: "easeInOut" },
        });
      },
    }),
    [controls, duration],
  );

  const inset = strokeWidth / 2;

  return (
    <svg
      aria-hidden="true"
      // z-[5]: görselin üstünde ama indirim etiketi / rozetlerin (z-10+) ALTINDA
      // kalmalı — çizgi etiketlerin üzerine binmesin.
      className={cn("pointer-events-none absolute inset-0 z-[5] h-full w-full", className)}
    >
      <motion.rect
        initial={{
          strokeDashoffset: defaultVisible ? 0 : 100,
          opacity: defaultVisible ? 1 : 0,
        }}
        animate={controls}
        x={inset}
        y={inset}
        rx={radius}
        pathLength={100}
        strokeDasharray={100}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          width: `calc(100% - ${strokeWidth}px)`,
          height: `calc(100% - ${strokeWidth}px)`,
        }}
      />
    </svg>
  );
});

/**
 * Sepete ekleme geri bildiriminin ortak mantığı: ürün kartı, indirimli
 * ürün şeridi gibi her yüzeyde aynı davranış —
 *  - 0→1: çizgi çevreyi dolanır ve kalır (traceRef.show)
 *  - sonraki artışlar: basma hissi veren pop (imagePulse)
 *  - adet 0: çizgi geri sarılır (traceRef.hide)
 * Kullanım: görsel kutusunu motion.div (animate={imagePulse}) yapıp içine
 * <BorderTrace ref={traceRef} defaultVisible={initiallyInCart} /> koyun.
 */
export function useCartAddFeedback(cartQuantity: number) {
  const imagePulse = useAnimationControls();
  const traceRef = useRef<BorderTraceHandle>(null);
  // Mount anında zaten sepetteyse çizgi animasyonsuz görünür başlar.
  const [initiallyInCart] = useState(cartQuantity > 0);
  const previousQuantityRef = useRef(cartQuantity);

  useEffect(() => {
    const previous = previousQuantityRef.current;
    if (previous === 0 && cartQuantity > 0) {
      traceRef.current?.show();
    } else if (cartQuantity > previous) {
      void imagePulse.start({
        scale: [1, 0.94, 1.02, 1],
        transition: { duration: 0.4, ease: [0.34, 1.35, 0.64, 1] },
      });
    }
    if (previous > 0 && cartQuantity === 0) {
      traceRef.current?.hide();
    }
    previousQuantityRef.current = cartQuantity;
  }, [cartQuantity, imagePulse]);

  return { imagePulse, traceRef, initiallyInCart };
}
