"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

// Ürün görseli tam ekran (28 Eyl 2026, tüm tenantlar): ürün sayfasında
// görsele dokununca açılır; parmakla sağa-sola kaydırılır (scroll-snap),
// masaüstünde oklar ve klavye (← → Esc), sağ üstte çarpı ya da görsel dışındaki
// boş alana dokunarak kapanır.
export function ProductImageLightbox({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: (lastIndex: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  useBodyScrollLock(true);

  // Açılışta seçili görsele atla (animasyonsuz).
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = startIndex * track.clientWidth;
  }, [startIndex]);

  function go(next: number) {
    const target = Math.max(0, Math.min(images.length - 1, next));
    const track = trackRef.current;
    if (track) track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(index);
      else if (event.key === "ArrowRight") go(index + 1);
      else if (event.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black" role="dialog" aria-modal="true" aria-label={alt}>
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          if (!track.clientWidth) return;
          const next = Math.round(track.scrollLeft / track.clientWidth);
          if (next !== index) setIndex(next);
        }}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((src, i) => (
          <div
            key={src}
            // Görselin dışındaki boş alana dokununca kapanır (görselin kendisine değil).
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose(index);
            }}
            className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tam çözünürlük, oran korunur */}
            <img
              src={src}
              alt={i === 0 ? alt : `${alt} ${i + 1}`}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onClose(index)}
        aria-label="Kapat"
        className="absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
      >
        <X className="size-6" />
      </button>

      {images.length > 1 ? (
        <>
          <span className="absolute left-4 top-[calc(env(safe-area-inset-top)+22px)] text-sm font-semibold tabular-nums text-white/80">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Önceki görsel"
            className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-30 sm:flex"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === images.length - 1}
            aria-label="Sonraki görsel"
            className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-30 sm:flex"
          >
            <ChevronRight className="size-7" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+18px)] flex justify-center gap-1.5">
            {images.map((src, i) => (
              <span
                key={src}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-1.5 bg-white/40")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
