import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müşterilerimiz",
  // Yalnız gerçek rakam: uydurma "850'den fazla" ifadesi kaldırıldı (14 Eki 2026).
  description:
    "eKatalox ile bayilerinden sipariş toplayan toptancılar ve üreticiler: Lucatech, Genax ve diğerleri. Gerçek kataloglar, gerçek kullanım.",
  alternates: {
    canonical: "/musteriler",
  },
  openGraph: {
    title: "Müşterilerimiz | eKatalox",
    description:
      "eKatalox ile bayilerinden sipariş toplayan toptancılar ve üreticiler: Lucatech, Genax ve diğerleri. Gerçek kataloglar, gerçek kullanım.",
    url: "https://www.ekatalox.com/musteriler",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
