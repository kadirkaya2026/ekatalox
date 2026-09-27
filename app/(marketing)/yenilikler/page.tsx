import Link from "next/link";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { Container, Section, SectionHeading } from "@/components/marketing/ui";

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
        <div className="space-y-6">{updates.map((update) => <article key={update.href} className="rounded-2xl border border-brand-line bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-brand-navy">{update.title}</h2>
          <p className="mt-4 leading-relaxed text-brand-muted">{update.description}</p>
          <Link href={update.href} className="mt-5 inline-block font-semibold text-brand-green hover:underline">{update.link} →</Link>
        </article>)}</div>
        <p className="mt-8 text-brand-muted">Bir öneriniz mi var? <Link href="/iletisim" className="font-semibold text-brand-green hover:underline">Bize yazın.</Link></p>
      </Container>
    </Section>
  </>;
}
