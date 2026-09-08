import type { Metadata, Viewport } from "next";
import {
  DM_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Source_Sans_3,
} from "next/font/google";
import { SiteAnalyticsTracker } from "@/components/site-analytics/site-analytics-tracker";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Pazarlama sitesi yazı tipleri (8 Eyl 2026): kurumsal, Türkçe karakterleri
// eksiksiz. Panel ve vitrin Inter ve tema yazı tiplerini kullanmaya devam eder.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
});

const fontVariables = [
  inter.variable,
  plexSans.variable,
  plexMono.variable,
  dmSans.variable,
  plusJakarta.variable,
  sourceSans.variable,
  playfair.variable,
].join(" ");

// viewport-fit=cover olmadan iPhone'da env(safe-area-inset-*) hep 0
// dönüyor; alt navigasyon barının güvenli alan payı (bottom-nav-inset)
// işlemiyor ve bar ana ekran çizgisinin altına biniyordu.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ekatalox.com"),
  // favicon app/ altından public/'e taşındı: dosya tabanlı favicon Next.js
  // tarafından HER rotaya otomatik ekleniyordu ve vitrin sayfaları kendi
  // ikonunu verse bile eKatalox ikonu HTML'de kalıyordu. Artık normal
  // metadata olarak tanımlı, dolayısıyla alt rotalar tamamen ezebiliyor.
  icons: { icon: "/favicon.ico" },
  title: {
    default: "eKatalox — Mahalle esnafı için komisyonsuz WhatsApp sipariş sistemi",
    template: "%s | eKatalox",
  },
  description:
    "Market, tekel, manav, kasap, çiçekçi ve petshoplar için WhatsApp sipariş sistemi. Müşteriniz dükkânınızı telefonundan gezsin, sipariş adresiyle WhatsApp'ınıza yazılı gelsin. Komisyon yok, kurulumu biz yapıyoruz, 1 ay ücretsiz.",
  applicationName: "eKatalox",
  keywords: [
    "market sipariş sistemi",
    "whatsapp sipariş sistemi",
    "bakkal online sipariş",
    "tekel sipariş",
    "manav online sipariş",
    "kasap sipariş uygulaması",
    "komisyonsuz sipariş",
    "mahalle esnafı sipariş",
    "qr magnet sipariş",
  ],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: "eKatalox",
    locale: "tr_TR",
    url: "https://www.ekatalox.com",
    title: "eKatalox — Mahallenizin siparişi WhatsApp'ınıza gelsin",
    description:
      "Komisyon yok, aracı yok, müşteri sizin. Market, tekel, manav, kasap, çiçekçi ve petshoplar için sipariş sistemi; kurulumu 2 saatte biz yapıyoruz.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "eKatalox",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eKatalox — Mahallenizin siparişi WhatsApp'ınıza gelsin",
    description:
      "Mahalle esnafı için komisyonsuz WhatsApp sipariş sistemi. Kurulum 2 saat, 1 ay ücretsiz.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${fontVariables} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
        {/* Yalnız pazarlama alan adında çalışır; panel/vitrin yolları izlenmez. */}
        <SiteAnalyticsTracker />
      </body>
    </html>
  );
}
