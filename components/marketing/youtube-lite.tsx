"use client";

import { useState } from "react";
import { Play } from "lucide-react";

// Hafif YouTube oynatıcı: önce yalnız kapak görseli; tıklanınca youtube-nocookie
// iframe'i yüklenir (sayfa hızlı kalır, tıklanmadan çerez bırakılmaz).
export function YouTubeLite({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&cc_load_policy=1&hl=tr`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-brand-navy"
      aria-label={`${title} videosunu oynat`}
    >
      {/* Kapak YouTube'dan; next/image alan adı ayarı gerektirmesin diye düz img. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20">
        <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-brand-navy shadow-lg transition group-hover:scale-105">
          <Play className="ml-0.5 size-6 fill-current" />
        </span>
      </span>
    </button>
  );
}
