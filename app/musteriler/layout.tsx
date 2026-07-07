import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müşterilerimiz",
  description:
    "850'den fazla toptancı ve distribütör eKatalox ile sipariş topluyor. Küçük butiklerden çok lokasyonlu distribütörlere uzanan başarı hikayeleri.",
  alternates: {
    canonical: "/musteriler",
  },
  openGraph: {
    title: "Müşterilerimiz | eKatalox",
    description:
      "850'den fazla toptancı ve distribütör eKatalox ile sipariş topluyor. Küçük butiklerden çok lokasyonlu distribütörlere uzanan başarı hikayeleri.",
    url: "https://www.ekatalox.com/musteriler",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
