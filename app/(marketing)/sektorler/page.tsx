import Link from "next/link";
import { Store, ArrowRight, Shirt, Cable, Armchair, Wrench, Package, Sparkles } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { WHOLESALE_SECTORS } from "@/lib/marketing/sectors";

export const metadata = marketingMetadata("/sektorler", "Sektöre Özel Dijital Katalog ve Sipariş Çözümleri", "Tekstil, elektronik, mobilya, otomotiv, gıda, kozmetik ve marketler için eKatalox çözümleri. Sektörünüze uygun dijital katalog ve sipariş akışını keşfedin.");
const icons = [Shirt, Cable, Armchair, Wrench, Package, Sparkles];
export default function SectorsPage() {
  return <>
    <Section tone="navy" glow className="py-12 sm:py-16"><Container>
      <SectionHeading dark as="h1" eyebrow="Sektörler" title="İşinizin ihtiyacına göre eKatalox." lead="Koleksiyonunu sunan üreticiden mahalleye sipariş hazırlayan markete: sektörünüzü seçin, günlük işinizde nasıl kullanacağınızı keşfedin." />
      <p className="mt-6 text-sm font-medium text-brand-neon">Her sektörde aynı paket fiyatları. İşletmenize uygun kullanım örnekleri.</p>
    </Container></Section>
    <Section tone="white"><Container>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{WHOLESALE_SECTORS.map((sector, i) => {
        const Icon = icons[i];
        return <Link key={sector.slug} href={`/sektorler/${sector.slug}`} className="group flex flex-col rounded-2xl border border-brand-line bg-brand-paper p-7 transition-colors hover:border-brand-green">
          <Icon className="size-8 text-brand-green" aria-hidden /><h2 className="mt-5 text-xl font-semibold text-brand-navy">{sector.name}</h2><p className="mt-3 flex-1 text-sm leading-relaxed text-brand-muted">{sector.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-green">Sektör çözümünü incele <ArrowRight className="size-4" aria-hidden /></span>
        </Link>;
      })}</div>
      <Link href="/sektorler/market-bakkal" className="mt-6 flex flex-col gap-6 rounded-3xl border border-brand-green/25 bg-brand-green-soft p-7 sm:flex-row sm:items-center sm:p-9">
        <Store className="size-10 shrink-0 text-brand-green" aria-hidden /><div className="flex-1"><h2 className="text-2xl font-semibold text-brand-navy">Market & Bakkallar</h2><p className="mt-3 max-w-2xl leading-relaxed text-brand-muted">Konumlu WhatsApp siparişi, mobil alt sepet ve müşteri bildirimleri. Kurumsal pakette 200 adet QR magnet hediyesi.</p></div><span className="inline-flex shrink-0 items-center gap-2 font-semibold text-brand-green">MarketGo ile keşfet <ArrowRight className="size-4" aria-hidden /></span>
      </Link>
    </Container></Section>
  </>;
}
