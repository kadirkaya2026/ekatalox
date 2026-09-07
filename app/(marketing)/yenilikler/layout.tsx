import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yenilikler ve Güncellemeler",
  description:
    "eKatalox'a her ay eklenen yeni özellikler, iyileştirmeler ve düzeltmeler. AI akıllı eşleştirme, sürükle-bırak sıralama ve daha fazlası.",
  alternates: {
    canonical: "/yenilikler",
  },
  openGraph: {
    title: "Yenilikler ve Güncellemeler | eKatalox",
    description:
      "eKatalox'a her ay eklenen yeni özellikler, iyileştirmeler ve düzeltmeler. AI akıllı eşleştirme, sürükle-bırak sıralama ve daha fazlası.",
    url: "https://www.ekatalox.com/yenilikler",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
