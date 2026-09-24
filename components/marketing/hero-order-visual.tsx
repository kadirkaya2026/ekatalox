import { FileText } from "lucide-react";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { WhatsAppGlyph } from "@/components/marketing/contact-dock";

// Ana sayfa hero görseli (24 Eyl 2026): telefonda demo toptan kataloğunun
// gerçek ekran görüntüsü, üstünde bayinin siparişinin WhatsApp'a PDF olarak
// düştüğü an. Sipariş kartındaki rakamlar demo mağazanın gerçek sepet ekran
// görüntüsüyle (public/site/toptan-sepet.png: 5 kalem, 12 ürün, ₺13.588) aynı.
// Tek hareket: kart sayfa açılışında bir kez içeri kayar (reduced-motion'da yok).
export function HeroOrderVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] pb-6 sm:pb-10">
      <div className="ml-auto w-[210px] sm:w-[250px] lg:mr-4">
        <div className="rounded-[13.5%/6.5%] shadow-[0_0_70px_-10px_rgba(34,197,94,0.35)]">
          <PhoneFrame
            src="/site/toptan-hero-iphone-v3.png"
            alt="Demo toptan kataloğunun bayi ekranı"
            priority
            className="w-full sm:w-full"
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 w-[250px] origin-bottom-left animate-[order-drop_700ms_cubic-bezier(0.2,0.8,0.2,1)_600ms_both] rounded-2xl bg-[#0B141A] p-2.5 text-left shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10 motion-reduce:animate-none sm:w-[280px]"
        aria-label="Örnek: siparişin WhatsApp'a PDF olarak gelmesi"
      >
        <div className="flex items-center gap-2 px-1.5 pb-2 pt-0.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#25D366] text-white">
            <WhatsAppGlyph className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[13px] font-semibold text-white">Yeni sipariş</p>
            <p className="text-[11px] text-white/50">Demotoptan kataloğundan</p>
          </div>
          <span className="ml-auto text-[11px] text-white/40">14:32</span>
        </div>
        <div className="rounded-xl rounded-tl-sm bg-[#005C4B] p-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-black/20 p-2">
            <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-[#E5484D] text-white">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">Siparis-1042.pdf</p>
              <p className="text-[11px] text-white/60">1 sayfa, PDF</p>
            </div>
          </div>
          <div className="mt-2 space-y-0.5 px-1 text-[12.5px] leading-snug text-white/90">
            <p>5 kalem, 12 ürün</p>
            <p>
              Toplam <span className="font-semibold tabular-nums">₺13.588,00</span>
            </p>
          </div>
          <p className="mt-1 text-right text-[10px] text-white/50">14:32 ✓✓</p>
        </div>
      </div>
    </div>
  );
}
