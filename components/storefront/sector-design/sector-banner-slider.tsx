"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BannerItem } from "@/lib/types";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import styles from "./sector-banner-slider.module.css";

// Sektör temalarında kendi kendine kayan banner şeridi (30 Eyl 2026, Autovale).
// Panel → Anasayfa Banner'ı'ndaki banner_items kullanılır (klasik temayla aynı
// veri): 3:1 görsel, 5 sn'de bir geçiş, parmakla kaydırma, noktalar ve oklar.
const AUTOPLAY_MS = 5000;

export function SectorBannerSlider({ items }: { items: BannerItem[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const banners = items.filter((item) => item.image_url && (!isMobile || item.is_visible_on_mobile !== false));
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
  }, [index]);

  if (!count) return null;
  const safeIndex = index % count;

  function go(next: number) {
    pausedUntil.current = Date.now() + AUTOPLAY_MS * 2;
    setIndex((next + count) % count);
  }

  return (
    <section className={styles.slider} aria-roledescription="carousel" aria-label="Kampanyalar">
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={() => { pausedUntil.current = Date.now() + AUTOPLAY_MS * 2; }}
        onScroll={(event) => {
          const el = event.currentTarget;
          if (!el.clientWidth) return;
          const next = Math.round(el.scrollLeft / el.clientWidth);
          if (next !== safeIndex && Date.now() < pausedUntil.current) setIndex(next);
        }}
      >
        {banners.map((banner, i) => {
          const href = banner.cta_href?.trim() || null;
          const image = <StorefrontImage src={banner.image_url!} alt={banner.title ?? `Banner ${i + 1}`} sizes="(max-width: 700px) 100vw, 1296px" className={styles.image} priority={i === 0} />;
          return (
            <div key={banner.id} className={styles.slide} aria-hidden={i !== safeIndex}>
              {href ? <a href={href} className={styles.link}>{image}</a> : image}
            </div>
          );
        })}
      </div>
      {count > 1 && <>
        <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={() => go(safeIndex - 1)} aria-label="Önceki"><ChevronLeft size={20} /></button>
        <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => go(safeIndex + 1)} aria-label="Sonraki"><ChevronRight size={20} /></button>
        <div className={styles.dots}>{banners.map((banner, i) => <button key={banner.id} type="button" aria-label={`Banner ${i + 1}`} aria-current={i === safeIndex} onClick={() => go(i)} />)}</div>
      </>}
    </section>
  );
}
