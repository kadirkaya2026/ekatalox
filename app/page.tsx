import type { Metadata } from "next";
import LandingPage from "@/components/homepage-landing";

export const metadata: Metadata = {
  title: "eKatalox | Excel’den saniyeler içinde B2B vitrin",
  description:
    "eKatalox ile Excel listenizi saniyeler içinde modern bir B2B katalog ve sipariş vitrini haline getirin. Toptancılar, distribütörler ve bayi ağları için hızlı demo, fiyatlandırma ve erken erişim.",
  alternates: {
    canonical: "https://ekatalox.com",
  },
  openGraph: {
    title: "eKatalox | Excel’den saniyeler içinde B2B vitrin",
    description:
      "Excel yükleyin, dijital B2B vitrininizi hızlıca yayınlayın. eKatalox; katalog, fiyatlandırma ve sipariş süreçlerini modernleştirir.",
    url: "https://ekatalox.com",
    siteName: "eKatalox",
    locale: "tr_TR",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
