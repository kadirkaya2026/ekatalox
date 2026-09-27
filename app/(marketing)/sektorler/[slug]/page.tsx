import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, Layers3, Languages } from "lucide-react";
import { WHOLESALE_SECTORS } from "@/lib/marketing/sectors";
import { SITE } from "@/lib/marketing/site";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return WHOLESALE_SECTORS.map(({ slug }) => ({ slug })); }
async function getSector(params: Props["params"]) {
  const { slug } = await params;
  const sector = WHOLESALE_SECTORS.find(item => item.slug === slug);
  if (!sector) notFound();
  return sector;
}
export async function generateMetadata({ params }: Props) {
  const sector = await getSector(params);
  return marketingMetadata(`/sektorler/${sector.slug}`, `${sector.shortName} için Dijital Katalog ve Sipariş Sistemi`, sector.description);
}
export default async function SectorPage({ params }: Props) {
  const sector = await getSector(params);
  const clothing = sector.slug === "tekstil-giyim";
  const faq = [...sector.faq, { q: "Sektöre göre paket fiyatları değişiyor mu?", a: "Hayır. Paket fiyatları ve limitleri ortaktır. Fiyatlandırma sayfasında Toptancı & Üretici görünümünden ihtiyaçlarınıza uygun paketi karşılaştırabilirsiniz." }, { q: "Siparişlerimi nereden takip ederim?", a: "Sipariş kayıtlarını paneldeki Siparişlerim sayfasından takip edebilirsiniz. Bildirimleri açtıysanız yeni sipariş geldiğinde haberdar olursunuz. WhatsApp sipariş mesajını müşteri gönderir." }];
  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Sektörler", item: `${SITE.url}/sektorler` },
      { "@type": "ListItem", position: 3, name: sector.name, item: `${SITE.url}/sektorler/${sector.slug}` },
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <Section tone="navy" glow className="py-12 sm:py-16"><Container>
      <nav aria-label="Sayfa yolu" className="mb-9 text-sm text-white/60"><Link href="/sektorler" className="hover:text-white">Sektörler</Link><span aria-hidden> / </span><span aria-current="page">{sector.shortName}</span></nav>
      <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-brand-neon">{sector.name}</p><h1 className="mt-5 text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">{sector.title}</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{sector.problem}</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink href={`/basvuru?sektor=${sector.registration}`}>Kataloğunu oluştur</ButtonLink><ButtonLink href="/fiyatlandirma?gorunum=toptanci" tone="outline-dark">Paketleri karşılaştır</ButtonLink></div><p className="mt-5 text-sm text-white/55">Ortak paket fiyatları · İşletmenize uygun kullanım</p></div>
        {clothing ? <figure className="mx-auto w-full max-w-[250px]">
          <div className="overflow-hidden rounded-[2rem] border-[5px] border-white/20 shadow-2xl"><Image src="/site/velira-mobile.png" alt="VELIRA giyim demosunun gerçek mobil ekranı: kategori menüsü, öne çıkan elbiseler ve sepete ekleme düğmeleri" width={390} height={844} sizes="250px" priority className="h-auto w-full" /></div>
          <figcaption className="mt-4 text-center text-xs text-white/60">VELIRA demosundan gerçek mobil ekran.</figcaption>
        </figure> : <aside className="rounded-3xl border border-white/15 bg-white/5 p-7 sm:p-8"><Layers3 className="size-8 text-brand-neon" aria-hidden /><p className="mt-5 text-xs font-semibold uppercase tracking-widest text-white/50">Örnek kullanım</p><h2 className="mt-3 text-2xl font-semibold leading-snug">{sector.example.title}</h2><p className="mt-4 leading-relaxed text-white/65">{sector.example.body}</p><ol className="mt-6 space-y-5">{sector.example.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/80"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-neon/15 font-semibold text-brand-neon">{i + 1}</span><span>{step}</span></li>)}</ol></aside>}
      </div>
    </Container></Section>
    {clothing && <Section><Container><SectionHeading eyebrow="Örnek kullanım" title={sector.example.title} lead={sector.example.body} /><ol className="mt-8 grid gap-5 md:grid-cols-3">{sector.example.steps.map((step, i) => <li key={step} className="rounded-2xl border border-brand-line bg-white p-6"><span className="text-sm font-semibold text-brand-green">0{i + 1}</span><p className="mt-4 leading-relaxed text-brand-navy">{step}</p></li>)}</ol></Container></Section>}
    <Section tone="white"><Container><SectionHeading eyebrow="İşinize uygun kullanım" title={`${sector.shortName} için öne çıkan araçlar`} /><div className="mt-9 grid gap-6 lg:grid-cols-3">{sector.benefits.map(benefit => <article key={benefit.title} className="flex flex-col rounded-2xl border border-brand-line p-7"><Check className="size-6 text-brand-green" aria-hidden /><h3 className="mt-5 text-xl font-semibold text-brand-navy">{benefit.title}</h3><p className="mt-4 flex-1 leading-relaxed text-brand-muted">{benefit.body}</p><Link href={`/ozellikler/${benefit.href}`} className="mt-6 text-sm font-semibold text-brand-green hover:underline">Özelliği incele →</Link></article>)}</div></Container></Section>
    <Section tone="white" className="pt-0 sm:pt-0"><Container><div className="rounded-2xl border border-brand-green/20 bg-brand-green-soft p-7 sm:p-9"><Languages className="size-7 text-brand-green" aria-hidden /><h2 className="mt-4 text-2xl font-semibold text-brand-navy">Yabancı müşterileriniz için İngilizce, Almanca ve Rusça</h2><p className="mt-4 max-w-3xl leading-relaxed text-brand-muted">Kataloğunuzda yabancı müşterileriniz için İngilizce, Almanca ve Rusça dil seçenekleri mevcuttur. Müşterileriniz dil menüsünden tercih ettikleri dili seçerek kataloğunuzu kullanabilir.</p><div className="mt-5 flex flex-wrap gap-2">{["İngilizce", "Almanca", "Rusça"].map(language => <span key={language} className="rounded-full border border-brand-green/20 bg-white px-4 py-2 text-sm font-semibold text-brand-green">{language}</span>)}</div></div></Container></Section>
    <Section><Container className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]"><div><SectionHeading eyebrow="Canlı demo" title={sector.demo ? "Giyim kataloğunu gerçek demo üzerinden keşfedin." : "Bayi kataloğu ve sipariş akışını deneyin."} lead={sector.demo?.description ?? "Genel toptancı demomuzdan katalog erişimini, ürün aramayı ve sepet akışını inceleyebilirsiniz. Demo elektronik ve aksesuar ürünleri içerir; kendi kataloğunuzu sektörünüzün ürünleriyle oluşturursunuz."} /></div><aside className="rounded-2xl border border-brand-line bg-white p-7"><p className="text-sm font-semibold text-brand-muted">{sector.demo?.name ?? "GENEL TOPTANCI DEMOSU"}</p>{!sector.demo && <p className="mt-4 text-xl font-semibold text-brand-navy">Demo giriş şifresi: <span className="font-plex-mono">{SITE.demoPassword}</span></p>}<div className="mt-6"><ButtonLink href={sector.demo?.url ?? SITE.demoUrl} external>{sector.demo ? "Giyim demosunu incele" : "Demoyu incele"} <ArrowUpRight className="size-4" aria-hidden /></ButtonLink></div></aside>
      {clothing && <figure className="min-w-0 lg:col-span-2"><div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-lg"><div className="flex items-center gap-2 border-b border-brand-line px-4 py-3"><span className="size-2 rounded-full bg-brand-line" /><span className="size-2 rounded-full bg-brand-line" /><span className="size-2 rounded-full bg-brand-line" /><span className="ml-2 truncate text-xs text-brand-muted">demo-giyim.ekatalox.com</span></div><Image src="/site/velira-desktop.png" alt="VELIRA giyim demosunun masaüstü görünümü: koleksiyon bannerı, ürün arama, kategori görselleri ve sepet" width={1272} height={716} sizes="(max-width: 768px) 100vw, 1100px" className="h-auto w-full" /></div><figcaption className="mt-4 text-sm text-brand-muted">VELIRA demosunun gerçek masaüstü ekranı. Görsellerdeki ürünler, fiyatlar ve kampanyalar demo içeriğidir.</figcaption></figure>}
    </Container></Section>
    <Section tone="white"><Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]"><SectionHeading eyebrow="Sık sorulanlar" title={`${sector.shortName} hakkında`} /><dl className="divide-y divide-brand-line">{faq.map(({ q, a }) => <div key={q} className="py-5 first:pt-0"><dt className="font-semibold text-brand-navy">{q}</dt><dd className="mt-3 leading-relaxed text-brand-muted">{a}</dd></div>)}</dl>{sector.slug === "gida-toptancilari" && <Link href="/sektorler/market-bakkal" className="font-semibold text-brand-green hover:underline">Market & Bakkallar çözümünü incele →</Link>}</Container></Section>
    <Section tone="navy"><Container><SectionHeading dark title="Ürünlerinizi ekleyin, kataloğunuzu paylaşın." lead="250 ürünle ücretsiz başlayın. Daha fazla ürün, raporlar ve bildirimler için aynı paketlerin toptancı sunumunu inceleyin." /><div className="mt-7 flex flex-wrap gap-3"><ButtonLink href={`/basvuru?sektor=${sector.registration}`}>Ücretsiz başla</ButtonLink><ButtonLink href="/fiyatlandirma?gorunum=toptanci" tone="outline-dark">Toptancı paketlerini gör</ButtonLink></div></Container></Section>
    <Section><Container><h2 className="text-2xl font-semibold text-brand-navy">Diğer sektörleri keşfedin</h2><div className="mt-6 flex flex-wrap gap-3">{WHOLESALE_SECTORS.filter(item => item.slug !== sector.slug).map(item => <Link key={item.slug} href={`/sektorler/${item.slug}`} className="rounded-xl border border-brand-line bg-white px-4 py-3 text-sm font-medium text-brand-navy hover:border-brand-green">{item.shortName} →</Link>)}<Link href="/sektorler/market-bakkal" className="rounded-xl border border-brand-line bg-white px-4 py-3 text-sm font-medium text-brand-navy hover:border-brand-green">Market & Bakkallar →</Link></div></Container></Section>
  </>;
}
