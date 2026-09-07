import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim ve Demo Talebi",
  description:
    "Demo, fiyat teklifi veya sorularınız için eKatalox ekibine ulaşın. Her talebe 24 saat içinde geri dönüş sağlıyoruz.",
  alternates: {
    canonical: "/iletisim",
  },
  openGraph: {
    title: "İletişim ve Demo Talebi | eKatalox",
    description:
      "Demo, fiyat teklifi veya sorularınız için eKatalox ekibine ulaşın. Her talebe 24 saat içinde geri dönüş sağlıyoruz.",
    url: "https://www.ekatalox.com/iletisim",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
