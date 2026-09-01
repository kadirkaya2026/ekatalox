"use client";

import { forwardRef, useImperativeHandle } from "react";
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
      className={cn("pointer-events-none absolute inset-0 z-20 h-full w-full", className)}
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
