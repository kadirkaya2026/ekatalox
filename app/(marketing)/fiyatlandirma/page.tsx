import { marketingMetadata } from "@/lib/marketing/metadata";
import { PricingContent } from "@/components/marketing/pricing-content";

export const metadata = marketingMetadata(
  "/fiyatlandirma",
  "Katalog ve Sipariş Programı Fiyatları",
  "Ücretsiz paket 250 ürün; Başlangıç 5.000 ₺, Profesyonel 10.000 ₺, Kurumsal 15.000 ₺ yıllık. Paket limitlerini ve özellikleri karşılaştırın.",
);

export default async function Page({ searchParams }: { searchParams: Promise<{ gorunum?: string | string[] }> }) {
  const params = await searchParams;
  const audience = params.gorunum === "market" ? "market" : "toptanci";
  return <PricingContent key={audience} initialAudience={audience} />;
}
