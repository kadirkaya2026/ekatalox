import Link from "next/link";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { Container, Section, SectionHeading } from "@/components/marketing/ui";
import { pastelStyle } from "@/components/marketing/home-v2/page-kit";

export const metadata = marketingMetadata(
  "/yenilikler", "Yenilikler ve Güncellemeler",
  "eKatalox tanıtım sayfalarındaki güncellemeleri ve dijital katalog rehberlerini inceleyin.",
);

const updates = [
  {
    title: "Dijital katalog ve sipariş rehberleri",
    description: "Blog bölümünde dijital katalog, ücretsiz başlangıç, PDF hazırlama, bayi fiyatları, Excel aktarımı ve WhatsApp sipariş konularını adım adım anlatan sekiz rehber yer alıyor.",
    href: "/blog", link: "Rehberleri okuyun",
  },
  {
    title: "Özelliklerin kapsamını ayrıntılarıyla inceleyin",
    description: "Minimum sepet, zorunlu müşteri bilgileri, Siparişlerim, alıcı seçimi, raporlar, toplu yükleme, kampanyalar, kurumsal site ve online ödeme için kullanım açıklamaları eklendi.",
    href: "/ozellikler", link: "Özellikleri inceleyin",
  },
  {
    title: "Paket karşılaştırması güncellendi",
    description: "Raporlar, bildirimler, kurumsal site ve Bayimiz ol formu dahil özelliklerin hangi paketlerde bulunduğunu karşılaştırma tablosunda görebilirsiniz.",
    href: "/fiyatlandirma", link: "Paketleri karşılaştırın",
  },
];

export default function UpdatesPage() {
  return <>
    <Section tone="white" className="pb-10 sm:pb-14">
      <Container><SectionHeading as="h1" eyebrow="Yenilikler" title="eKatalox’ta neler değişti?" lead="Tanıtım sayfalarındaki güncellemeler ve kataloğunuzu kullanmanıza yardımcı olacak yeni içerikler." /></Container>
    </Section>
    <Section>
      <Container className="max-w-4xl">
        <p className="mb-8 text-sm text-brand-muted">İçerik güncellemesi · <time dateTime="2026-09-27">27 Eylül 2026</time></p>
        <div className="space-y-6">{updates.map((update, i) => <article key={update.href} className="rounded-[24px] p-7 sm:p-9" style={pastelStyle(i)}>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-navy">{update.title}</h2>
          <p className="mt-4 leading-relaxed text-brand-navy/70">{update.description}</p>
          <Link href={update.href} className="mt-6 inline-flex rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy">{update.link} →</Link>
        </article>)}</div>
        <p className="mt-8 text-brand-muted">Bir öneriniz mi var? <Link href="/iletisim" className="font-semibold text-brand-green hover:underline">Bize yazın.</Link></p>
      </Container>
    </Section>
  </>;
}
