import type { Metadata } from "next";
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
    <html lang="tr" className={`${fontVariables} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
