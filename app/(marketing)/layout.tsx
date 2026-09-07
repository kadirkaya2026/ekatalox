import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

// Pazarlama sitesi ortak kabuğu (8 Eyl 2026 yeniden konumlandırma).
// Admin, panel ve vitrin bu layout'un dışında; kök layout yazı tiplerini yükler.
export const metadata: Metadata = {
  title: {
    default: "eKatalox — Mahalle esnafı için komisyonsuz WhatsApp sipariş sistemi",
    template: "%s | eKatalox",
  },
  description:
    "Market, tekel, manav, kasap, çiçekçi ve petshoplar için: müşteriniz dükkânınızı telefonundan gezsin, sipariş WhatsApp'ınıza yazılı gelsin. Komisyon yok, kurulumu biz yapıyoruz, 1 ay ücretsiz.",
  keywords: [
    "market sipariş sistemi",
    "whatsapp sipariş",
    "tekel sipariş",
    "manav online sipariş",
    "kasap sipariş uygulaması",
    "komisyonsuz sipariş",
    "mahalle esnafı sipariş",
    "getir alternatifi esnaf",
  ],
  openGraph: {
    type: "website",
    siteName: "eKatalox",
    locale: "tr_TR",
    url: "https://www.ekatalox.com",
    title: "eKatalox — Mahallenizin siparişi WhatsApp'ınıza gelsin",
    description: "Komisyon yok, aracı yok, müşteri sizin. Market, tekel, manav, kasap ve petshoplar için sipariş sistemi.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "eKatalox" }],
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-plex min-h-screen bg-brand-paper text-brand-ink antialiased">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
