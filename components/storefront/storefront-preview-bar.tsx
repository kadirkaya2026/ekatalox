"use client";

// Panelden "Önizle" ile yeni sekmede açılan gerçek mağazanın altındaki çubuk:
// bu görünüm yalnız bayiye görünür; "Bu temayı uygula" panele döner ve temayı
// kaydeder (kayıt yetkisi panelde, vitrinde değil).
export function StorefrontPreviewBar({ applyHref, label }: { applyHref: string; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-emerald-400/40 bg-slate-900/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">Tema önizlemesi</span> · {label}
          <span className="text-white/60"> — bu görünümü yalnız siz görüyorsunuz, müşterileriniz görmez.</span>
        </p>
        <div className="flex shrink-0 gap-2">
          <a
            href={applyHref}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-emerald-300"
          >
            Bu temayı uygula
          </a>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
