"use client";

// Pazarlama sitesi iletişim yuvası (24 Eyl 2026, reklam öncesi CRO):
//  - Masaüstü: sağ altta sabit yuvarlak WhatsApp düğmesi.
//  - Mobil: sayfa tepesindeyken aynı yuvarlak düğme; hero geçilince altta
//    sabit "Ücretsiz kataloğumu kur + WhatsApp" çubuğu. /basvuru'da çubuk
//    gösterilmez (form zaten orada), yalnız WhatsApp düğmesi kalır.
// WhatsApp tıklaması Meta Pixel'e Contact olarak gider.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackMetaEvent } from "@/lib/marketing/meta-pixel";
import { SITE } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

const WA_TEXT = "Merhaba, eKatalox hakkında bilgi almak istiyorum.";
export const MARKETING_WHATSAPP_HREF = `${SITE.whatsappHref}?text=${encodeURIComponent(WA_TEXT)}`;

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.43-9.43a9.37 9.37 0 0 1 9.42 9.44c0 5.2-4.23 9.42-9.43 9.42m8.02-17.44A11.26 11.26 0 0 0 12.05.75C5.8.75.7 5.84.7 12.1c0 2 .52 3.95 1.52 5.67L.6 23.25l5.61-1.47a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.35-5.1 11.35-11.35 0-3.03-1.18-5.88-3.33-8.02" />
    </svg>
  );
}

export function ContactDock() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const showBar = scrolled && pathname !== "/basvuru";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onWhatsApp = () => trackMetaEvent("Contact", { method: "whatsapp" });

  return (
    <>
      {/* Yuvarlak WhatsApp düğmesi: masaüstünde hep, mobilde çubuk yokken */}
      <a
        href={MARKETING_WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onWhatsApp}
        aria-label="WhatsApp'tan yazın"
        className={cn(
          "group fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-105",
          showBar && "max-md:hidden",
        )}
      >
        <WhatsAppGlyph className="size-7" />
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-brand-dark px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
          WhatsApp&apos;tan sorun
        </span>
      </a>

      {/* Mobil alt çubuk */}
      <div
        aria-hidden={!showBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-dark/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-lg transition-transform duration-300 md:hidden",
          showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/basvuru"
            tabIndex={showBar ? 0 : -1}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand-neon text-[15px] font-semibold text-white"
          >
            Ücretsiz kataloğumu kur
          </Link>
          <a
            href={MARKETING_WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsApp}
            tabIndex={showBar ? 0 : -1}
            aria-label="WhatsApp'tan yazın"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"
          >
            <WhatsAppGlyph className="size-6" />
          </a>
        </div>
      </div>
    </>
  );
}
