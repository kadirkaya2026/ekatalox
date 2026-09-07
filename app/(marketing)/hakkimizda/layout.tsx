import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "eKatalox'u tanıyın: toptan ticareti dijitalleştiren B2B katalog ve sipariş platformunun arkasındaki ekip, vizyon ve değerler.",
  alternates: {
    canonical: "/hakkimizda",
  },
  openGraph: {
    title: "Hakkımızda | eKatalox",
    description:
      "eKatalox'u tanıyın: toptan ticareti dijitalleştiren B2B katalog ve sipariş platformunun arkasındaki ekip, vizyon ve değerler.",
    url: "https://www.ekatalox.com/hakkimizda",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
