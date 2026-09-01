"use client";

import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BorderTraceHandle {
  /** Çizgiyi bir tur dolandırıp söndürür; tekrar çağrılabilir. */
  play: () => void;
}

/**
 * Getir tarzı "çevreyi dolanan çizgi" efekti (animated border trace).
 *
 * Kapsayıcıyı (relative olmalı) dolduran bir SVG rect çizer; play()
 * çağrılınca stroke-dashoffset 100→0'a inerek çizgi köşeden başlayıp
 * çevreyi ~yarım saniyede bir kez dolanır, tamamlanınca sönerek kaybolur.
 * pathLength={100} numarası sayesinde gerçek çevre uzunluğunu ölçmeye
 * gerek yok — her boyutta aynı süre/oran çalışır.
 *
 * Renk currentColor'dan gelir: className ile text-* verin (ör. bayinin
 * + butonu rengi — text-[var(--brand-primary)] ya da tema accent'i).
 *
 * Kullanım:
 *   const trace = useRef<BorderTraceHandle>(null);
 *   <div className="relative ...">
 *     <BorderTrace ref={trace} className="text-emerald-600" radius={19} />
 *   </div>
 *   trace.current?.play();
 */
export const BorderTrace = forwardRef<
  BorderTraceHandle,
  {
    className?: string;
    /** Kapsayıcının border-radius'u (px) — çizgi köşeleri buna oturur. */
    radius?: number;
    strokeWidth?: number;
    /** Çizginin çevreyi dolanma süresi (sn). Getir hissi: 0.4–0.6. */
    duration?: number;
  }
>(function BorderTrace(
  { className, radius = 19, strokeWidth = 2.5, duration = 0.5 },
  ref,
) {
  const controls = useAnimationControls();

  useImperativeHandle(
    ref,
    () => ({
      play() {
        const fade = 0.18;
        void controls.start({
          strokeDashoffset: [100, 0, 0],
          opacity: [1, 1, 0],
          transition: {
            duration: duration + fade,
            times: [0, duration / (duration + fade), 1],
            ease: "easeInOut",
          },
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
        initial={{ strokeDashoffset: 100, opacity: 0 }}
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
