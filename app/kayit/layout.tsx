import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ücretsiz Kayıt — Kendi B2B Kataloğunuzu Oluşturun",
  description:
    "Dakikalar içinde kendi alan adınızda şifre korumalı B2B kataloğunuzu kurun. Excel'den ürünlerinizi yükleyin, bayilerinize özel fiyat listeleriyle sipariş toplamaya başlayın.",
  alternates: {
    canonical: "/kayit",
  },
  openGraph: {
    title: "Ücretsiz Kayıt — Kendi B2B Kataloğunuzu Oluşturun | eKatalox",
    description:
      "Dakikalar içinde kendi alan adınızda şifre korumalı B2B kataloğunuzu kurun. Excel'den ürünlerinizi yükleyin, bayilerinize özel fiyat listeleriyle sipariş toplamaya başlayın.",
    url: "https://www.ekatalox.com/kayit",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
