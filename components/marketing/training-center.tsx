"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Search, X } from "lucide-react";
import type { TutorialGroup, TutorialVideo } from "@/lib/marketing/tutorial-videos";

// Eğitim Merkezi (10 Eki 2026): arama, "Buradan başlayın" yolu, konu menüsü ve
// büyük kartlar. Video sayfada küçük karede değil, ekranı kaplayan oynatıcıda açılır
// (youtube-nocookie; tıklanmadan iframe/çerez yok).

const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const normalize = (value: string) =>
  value.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export function TrainingCenter({ groups, startHere }: { groups: TutorialGroup[]; startHere: TutorialVideo[] }) {
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<TutorialVideo | null>(null);
  const [playlist, setPlaylist] = useState<TutorialVideo[]>([]);

  const q = normalize(query.trim());
  const filtered = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          videos: q ? group.videos.filter((v) => normalize(`${v.title} ${v.description} ${group.title}`).includes(q)) : group.videos,
        }))
        .filter((group) => group.videos.length),
    [groups, q],
  );
  const resultCount = filtered.reduce((total, group) => total + group.videos.length, 0);

  const open = (video: TutorialVideo, list: TutorialVideo[]) => {
    setPlaylist(list);
    setPlaying(video);
  };
  const index = playing ? playlist.findIndex((v) => v.id === playing.id) : -1;
  const step = useCallback(
    (delta: number) => {
      if (index < 0) return;
      const next = playlist[index + delta];
      if (next) setPlaying(next);
    },
    [index, playlist],
  );

  useEffect(() => {
    if (!playing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlaying(null);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [playing, step]);

  return (
    <>
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ne öğrenmek istiyorsunuz? Örn. banner, Excel, fiyat listesi"
          className="h-12 w-full rounded-full border border-brand-line bg-white pl-12 pr-4 text-base text-brand-ink outline-none transition focus:border-brand-navy"
          aria-label="Eğitim videolarında ara"
        />
      </div>

      {!q ? (
        <section className="mt-10" aria-labelledby="baslangic">
          <h2 id="baslangic" className="text-xl font-semibold text-brand-navy sm:text-2xl">
            Buradan başlayın
          </h2>
          <p className="mt-1 text-sm text-brand-muted">Yeni başlayanlar için sırayla izlenecek {startHere.length} video.</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {startHere.map((video, i) => (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => open(video, startHere)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-brand-line bg-white text-left transition hover:border-brand-navy"
                >
                  <Thumb video={video} />
                  <span className="flex flex-1 items-start gap-2.5 p-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold leading-snug text-brand-navy">{video.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mt-12 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Konular" className="mb-8 lg:mb-0">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible">
            <p className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-brand-muted lg:block">Konular</p>
            {filtered.map((group) => (
              <a
                key={group.slug}
                href={`#${group.slug}`}
                className="shrink-0 rounded-full border border-brand-line bg-white px-3.5 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:border-brand-navy lg:flex lg:items-center lg:justify-between lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3 lg:py-2 lg:hover:bg-brand-paper"
              >
                {group.title}
                <span className="ml-1.5 text-brand-muted">{group.videos.length}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-14">
          {q ? (
            <p className="text-sm text-brand-muted">
              “{query.trim()}” için {resultCount} video{resultCount ? "" : ". Farklı bir kelime deneyin."}
            </p>
          ) : null}
          {filtered.map((group) => (
            <section key={group.slug} id={group.slug} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-brand-navy sm:text-2xl">{group.title}</h2>
              <p className="mt-1 text-sm text-brand-muted">{group.lead}</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {group.videos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => open(video, group.videos)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-brand-line bg-white text-left transition hover:border-brand-navy hover:shadow-sm"
                  >
                    <Thumb video={video} />
                    <span className="p-4">
                      <span className="block font-semibold leading-snug text-brand-navy">{video.title}</span>
                      <span className="mt-1.5 line-clamp-2 block text-sm text-brand-muted">{video.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {playing ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
          onClick={() => setPlaying(null)}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={(e) => e.stopPropagation()}>
            <p className="min-w-0 truncate text-sm font-semibold sm:text-base">{playing.title}</p>
            <button
              type="button"
              onClick={() => setPlaying(null)}
              className="shrink-0 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Kapat"
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-0 sm:px-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-6xl">
              <iframe
                key={playing.id}
                className="aspect-video w-full bg-black sm:rounded-lg"
                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&cc_load_policy=1&hl=tr`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
              <p className="mt-3 px-4 text-sm text-white/70 sm:px-0">{playing.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => step(-1)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:invisible"
            >
              <ChevronLeft className="size-4" /> Önceki
            </button>
            <span className="text-xs text-white/50">
              {index + 1} / {playlist.length}
            </span>
            <button
              type="button"
              disabled={index < 0 || index >= playlist.length - 1}
              onClick={() => step(1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white/90 disabled:invisible"
            >
              Sonraki video <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Thumb({ video }: { video: TutorialVideo }) {
  return (
    <span className="relative block aspect-video w-full overflow-hidden bg-brand-navy">
      {/* Kapak YouTube'dan; next/image alan adı ayarı gerektirmesin diye düz img. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/15">
        <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-brand-navy opacity-90 shadow-lg transition group-hover:scale-105 group-hover:opacity-100">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      </span>
      <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-plex-mono text-[11px] font-medium text-white">
        {duration(video.seconds)}
      </span>
    </span>
  );
}
