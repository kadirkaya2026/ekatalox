import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

// Pazarlama sitesi ortak kabuğu (20 Eyl 2026 toptancı/freemium konumlandırması).
// Admin, panel ve vitrin bu layout'un dışında; kök layout yazı tiplerini yükler.
export const metadata: Metadata = {
  title: {
    default: "eKatalox — Toptancılar için ücretsiz online katalog ve WhatsApp sipariş",
    template: "%s | eKatalox",
  },
  description:
    "PDF katalog yerine şifreli online katalog: bayileriniz kendi fiyat listesini görsün, sepetini doldurup WhatsApp'tan sipariş versin. Ücretsiz plan, kart istenmez, komisyon yok.",
  keywords: [
    "toptancı katalog",
    "b2b katalog",
    "online katalog",
    "bayi sipariş sistemi",
    "whatsapp sipariş",
    "şifreli fiyat listesi",
    "toptan sipariş uygulaması",
    "ücretsiz katalog sitesi",
  ],
  openGraph: {
    type: "website",
    siteName: "eKatalox",
    locale: "tr_TR",
    url: "https://www.ekatalox.com",
    title: "eKatalox — PDF kataloğunuz artık canlı bir sipariş sayfası",
    description: "Toptancılar için ücretsiz online katalog. Bayi şifreyle girer, kendi fiyatını görür, WhatsApp'tan sipariş verir.",
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
