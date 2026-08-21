"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Giriş ekranındaki maskotlar. Üç şey yapıyorlar:
//   1) Açılışta yukarıdan dönerek düşüp yerlerine oturuyorlar (kademeli).
//   2) Boştayken gözbebekleri fareyi takip ediyor.
//   3) Şifre alanına odaklanınca gözlerini kapatıyorlar — "bakmıyorum".
//      E-posta alanında ise mor karakter merakla öne eğiliyor.
//
// prefers-reduced-motion açıksa tüm hareket kapanır, şekiller doğrudan
// son hâlleriyle çizilir.
export type MascotFocus = "idle" | "email" | "password";

const SPRING = { type: "spring" as const, stiffness: 240, damping: 18, mass: 0.9 };

function Eyes({
  closed,
  offset,
  cx,
  cy,
  gap,
  r = 4.6,
}: {
  closed: boolean;
  offset: { x: number; y: number };
  cx: number;
  cy: number;
  gap: number;
  r?: number;
}) {
  if (closed) {
    // Kapalı göz: iki kısa çizgi.
    return (
      <g stroke="#0b1220" strokeWidth={2.4} strokeLinecap="round">
        <line x1={cx - gap - 4} y1={cy} x2={cx - gap + 4} y2={cy} />
        <line x1={cx + gap - 4} y1={cy} x2={cx + gap + 4} y2={cy} />
      </g>
    );
  }

  return (
    <g fill="#0b1220">
      <circle cx={cx - gap + offset.x} cy={cy + offset.y} r={r} />
      <circle cx={cx + gap + offset.x} cy={cy + offset.y} r={r} />
    </g>
  );
}

export function LoginMascots({ focus }: { focus: MascotFocus }) {
  const reduceMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  const eyesClosed = focus === "password";
  const peeking = focus === "email";

  useEffect(() => {
    if (reduceMotion) return;

    function handleMove(event: MouseEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      // Gözbebeği göz yuvasından çıkmasın diye sabit yarıçapla sınırlanıyor.
      const limit = Math.min(distance, 90) / 90;
      setPupil({ x: (dx / distance) * 2.6 * limit, y: (dy / distance) * 2.6 * limit });
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reduceMotion]);

  const offset = eyesClosed ? { x: 0, y: 0 } : pupil;
  const enter = (delay: number, from: { y: number; rotate: number }) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { y: from.y, rotate: from.rotate, opacity: 0 },
          animate: { y: 0, rotate: 0, opacity: 1 },
          transition: { ...SPRING, delay },
        };

  return (
    <div ref={wrapperRef} className="mb-6 flex justify-center" aria-hidden="true">
      <svg viewBox="0 0 240 116" className="h-28 w-auto" role="presentation">
        {/* Turuncu: alttan büyüyerek geliyor */}
        <motion.g
          initial={reduceMotion ? false : { scaleY: 0.1, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.18 }}
          style={{ transformOrigin: "78px 108px" }}
        >
          <path d="M30 108a48 48 0 0 1 96 0Z" fill="#f97316" />
          <Eyes closed={eyesClosed} offset={offset} cx={78} cy={84} gap={13} />
          {eyesClosed ? (
            <path d="M70 97q8 5 16 0" stroke="#0b1220" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          ) : (
            <path d="M70 95q8 7 16 0" stroke="#0b1220" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          )}
        </motion.g>

        {/* Mor: e-posta yazılırken merakla öne eğilen karakter */}
        <motion.g
          {...enter(0, { y: -140, rotate: -35 })}
          style={{ transformOrigin: "108px 108px" }}
        >
          <motion.g
            animate={reduceMotion ? undefined : { rotate: peeking ? 16 : 0 }}
            transition={SPRING}
            style={{ transformOrigin: "108px 108px" }}
          >
            <rect x="86" y="24" width="44" height="84" rx="5" fill="var(--marketing-primary)" />
            <Eyes closed={eyesClosed} offset={offset} cx={108} cy={46} gap={9} r={4.2} />
          </motion.g>
        </motion.g>

        {/* Siyah: yukarıdan dönerek düşen karakter */}
        <motion.g {...enter(0.08, { y: -170, rotate: 48 })} style={{ transformOrigin: "150px 108px" }}>
          <rect x="130" y="52" width="40" height="56" rx="5" fill="#e2e8f0" />
          <Eyes closed={eyesClosed} offset={offset} cx={150} cy={72} gap={9} r={4.2} />
        </motion.g>

        {/* Sarı: tek gözlü, gagalı */}
        <motion.g {...enter(0.26, { y: -120, rotate: -22 })} style={{ transformOrigin: "192px 108px" }}>
          <path d="M168 108V88a24 24 0 0 1 48 0v20Z" fill="#fbbf24" />
          {eyesClosed ? (
            <line x1="184" y1="84" x2="192" y2="84" stroke="#0b1220" strokeWidth={2.4} strokeLinecap="round" />
          ) : (
            <circle cx={188 + offset.x} cy={84 + offset.y} r={4.2} fill="#0b1220" />
          )}
          <line x1="200" y1="92" x2="222" y2="92" stroke="#0b1220" strokeWidth={2.6} strokeLinecap="round" />
        </motion.g>
      </svg>
    </div>
  );
}
