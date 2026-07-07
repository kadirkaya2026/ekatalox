import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yardım Merkezi",
  description:
    "eKatalox yardım merkezi: başlarken, Excel ile ürün yükleme, fiyat listeleri, erişim kodları ve katalog yönetimi hakkında rehberler.",
  alternates: {
    canonical: "/yardim",
  },
  openGraph: {
    title: "Yardım Merkezi | eKatalox",
    description:
      "eKatalox yardım merkezi: başlarken, Excel ile ürün yükleme, fiyat listeleri, erişim kodları ve katalog yönetimi hakkında rehberler.",
    url: "https://www.ekatalox.com/yardim",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
