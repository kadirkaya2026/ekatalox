import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "eKatalox - Ticaretin Dijital İşletim Sistemi",
    template: "%s | eKatalox",
  },
  description:
    "Çok kiracılı B2B sipariş katalog altyapısı. Toptancıların alt alan adlarında şifreye dayalı fiyat katmanlarıyla sipariş toplamasını sağlar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
