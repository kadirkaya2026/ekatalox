import { marketingMetadata } from "@/lib/marketing/metadata";
import { PricingContent } from "@/components/marketing/pricing-content";

export const metadata = marketingMetadata(
  "/fiyatlandirma",
  "Dijital Katalog Fiyatları ve Ücretsiz Paket",
  "250 ürünle ücretsiz başlayın. Başlangıç, Profesyonel ve Kurumsal paketlerin yıllık fiyatlarını, ürün sınırlarını ve özelliklerini karşılaştırın.",
);

export default async function Page({ searchParams }: { searchParams: Promise<{ gorunum?: string | string[] }> }) {
  const params = await searchParams;
  const audience = params.gorunum === "market" ? "market" : "toptanci";
  return <PricingContent key={audience} initialAudience={audience} />;
}
