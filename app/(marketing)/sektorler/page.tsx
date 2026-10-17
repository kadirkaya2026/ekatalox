import Link from "next/link";
import { Store, ArrowRight, Shirt, Cable, Armchair, Wrench, Package, Sparkles } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/marketing/ui";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { WHOLESALE_SECTORS } from "@/lib/marketing/sectors";
import { Accent, BandCard, ClosingCta, CustomerMarquee, PageHero, pastelStyle } from "@/components/marketing/home-v2/page-kit";

export const metadata = marketingMetadata("/sektorler", "Sektörlere Göre Toptan Katalog ve Sipariş", "Tekstil, elektronik, mobilya, otomotiv, gıda, kozmetik ve marketler için eKatalox çözümleri. Sektörünüze uygun dijital katalog ve sipariş akışını keşfedin.");
const icons = [Shirt, Cable, Armchair, Wrench, Package, Sparkles];
export default function SectorsPage() {
  return <>
    <PageHero eyebrow="Sektörler" title={<>İşinizin ihtiyacına göre <Accent>eKatalox.</Accent></>} lead="Koleksiyonunu sunan üreticiden mahalleye sipariş hazırlayan markete: sektörünüzü seçin, günlük işinizde nasıl kullanacağınızı keşfedin. Her sektörde aynı paket fiyatları." />
    <Section tone="white" className="pt-0 sm:pt-0"><Container>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{WHOLESALE_SECTORS.map((sector, i) => {
        const Icon = icons[i];
        return <BandCard key={sector.slug} index={i} href={`/sektorler/${sector.slug}`} band={<div className="flex w-full items-end justify-between"><span className="flex size-14 items-center justify-center rounded-2xl bg-white/80 text-brand-navy shadow-sm"><Icon className="size-7" aria-hidden /></span><h2 className="text-right text-2xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy">{sector.shortName}</h2></div>}>
          <p className="flex-1 text-[15px] leading-relaxed text-brand-muted">{sector.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-green">Sektör çözümünü incele <ArrowRight className="size-4" aria-hidden /></span>
        </BandCard>;
      })}</div>
      <Link href="/sektorler/market-bakkal" className="mt-8 flex flex-col gap-6 rounded-[28px] p-8 sm:flex-row sm:items-center sm:p-10" style={pastelStyle(0)}>
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-brand-navy"><Store className="size-8" aria-hidden /></span><div className="flex-1"><h2 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-navy">Market & Bakkallar</h2><p className="mt-3 max-w-2xl leading-relaxed text-brand-navy/70">Müşteri üyeliği ve sipariş takibi, kayıtlı adresler, kapıda ya da online ödeme (iyzico, PayTR, Paynet), konumlu sipariş ve bildirimler. Sınırlı süre: Kurumsal pakette 1000 adet QR magnet hediye.</p></div><span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white">MarketGo ile keşfet <ArrowRight className="size-4" aria-hidden /></span>
      </Link>
    </Container></Section>
    <CustomerMarquee />
    <ClosingCta title="Sektörünüz ne olursa olsun, ilk katalog ücretsiz." lead="250 ürünle başlayın, bayilerinize şifreyi gönderin. Fiyat listesi, sipariş fişi ve panel her sektörde aynı." index={2} />
  </>;
}
