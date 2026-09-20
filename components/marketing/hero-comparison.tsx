import { ArrowRight } from "lucide-react";
import { PhoneFrame } from "@/components/marketing/phone-frame";

// PDF katalog → canlı katalog karşılaştırması (21 Eyl 2026 koyu tema
// yeniden tasarımı). Solda durağan/gri bir PDF sayfası taklidi, sağda demo
// mağazadan gerçek ekran görüntüsü içeren telefon çerçevesi. Statik PDF
// tarafı uydurma bir ürün görseli değil, salt geometrik bir taklit
// (gerçek ürün/marka görüntüsü kullanılmıyor).
export function HeroComparison() {
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-5">
      <div className="w-[150px] shrink-0 sm:w-[168px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <div className="mb-2 flex items-center gap-1 px-1">
            <span className="size-1.5 rounded-full bg-white/20" />
            <span className="size-1.5 rounded-full bg-white/20" />
            <span className="size-1.5 rounded-full bg-white/20" />
          </div>
          <div className="space-y-2 rounded-lg bg-white/[0.04] p-2.5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-2 rounded bg-white/[0.05] p-1.5">
                <div className="size-6 shrink-0 rounded bg-white/10" />
                <div className="flex-1 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-white/10" />
                  <div className="h-1.5 w-2/3 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2.5 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-white/35">PDF katalog</p>
      </div>

      <div
        aria-hidden
        className="flex size-9 shrink-0 rotate-90 items-center justify-center rounded-full bg-brand-neon/15 text-brand-neon sm:rotate-0"
      >
        <ArrowRight className="size-4" />
      </div>

      <div className="shrink-0">
        <div className="rounded-[13.5%/6.5%] shadow-[0_0_60px_-8px_rgba(34,197,94,0.35)]">
          <PhoneFrame
            src="/site/toptan-hero-iphone-v2.png"
            alt="Demo toptan kataloğunun gerçek ekran görüntüsü"
            priority
            className="w-[220px] sm:w-[240px]"
          />
        </div>
        <p className="mt-2.5 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-brand-neon">Canlı katalog</p>
      </div>
    </div>
  );
}
