import type { Metadata, Viewport } from "next";
import {
  DM_Sans,
  Inter,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Source_Sans_3,
} from "next/font/google";
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

const fontVariables = [
  inter.variable,
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
    default: "eKatalox — Toptan Ticaretin Dijital İşletim Sistemi",
    template: "%s | eKatalox",
  },
  description:
    "Toptancılar ve distribütörler için B2B sipariş ve dijital katalog platformu. Kendi alan adınızda şifre korumalı katalog, bayiye özel fiyat listeleri, Excel'den saniyeler içinde ürün yükleme ve online sipariş toplama.",
  applicationName: "eKatalox",
  keywords: [
    "b2b katalog",
    "dijital katalog",
    "toptan satış programı",
    "bayi sipariş sistemi",
    "toptancı sipariş uygulaması",
    "fiyat listesi yönetimi",
    "b2b sipariş platformu",
    "online katalog oluşturma",
  ],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: "eKatalox",
    locale: "tr_TR",
    url: "https://www.ekatalox.com",
    title: "eKatalox — Toptan Ticaretin Dijital İşletim Sistemi",
    description:
      "Toptancılar ve distribütörler için B2B sipariş ve dijital katalog platformu. Şifre korumalı katalog, bayiye özel fiyat listeleri, Excel'den ürün yükleme.",
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
    title: "eKatalox — Toptan Ticaretin Dijital İşletim Sistemi",
    description:
      "Toptancılar ve distribütörler için B2B sipariş ve dijital katalog platformu.",
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
      </body>
    </html>
  );
}
