import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Languages } from "lucide-react";
import { WHOLESALE_SECTORS } from "@/lib/marketing/sectors";
import { SITE } from "@/lib/marketing/site";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { ButtonLink, Container } from "@/components/marketing/ui";
import { BandCard, Breadcrumb, ClosingCta, CustomerMarquee, FaqList, PageHero, TintBox, pastelStyle } from "@/components/marketing/home-v2/page-kit";

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
  return marketingMetadata(`/sektorler/${sector.slug}`, sector.seoTitle, sector.description);
}

// TASLAK (14 Eki 2026): sektör sayfası Beacons dilinde; veri ve şema aynı.
export default async function SectorPage({ params }: Props) {
  const sector = await getSector(params);
  const clothing = sector.slug === "tekstil-giyim";
  const index = Math.max(0, WHOLESALE_SECTORS.findIndex((s) => s.slug === sector.slug));
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

    <PageHero
      breadcrumb={<Breadcrumb items={[{ href: "/sektorler", label: "Sektörler" }, { label: sector.shortName }]} />}
      eyebrow={sector.name}
      title={sector.title}
      lead={sector.problem}
      actions={<><ButtonLink href={`/basvuru?sektor=${sector.registration}`} tone="navy" size="lg" className="px-9">Kataloğunu oluştur</ButtonLink><ButtonLink href="/fiyatlandirma?gorunum=toptanci" tone="outline" size="lg">Paketleri karşılaştır</ButtonLink></>}
      className="pb-6 sm:pb-8"
    >
      <p className="mt-6 text-center text-sm text-brand-muted">{sector.seoTitle} · Ortak paket fiyatları</p>
    </PageHero>

    <section className="bg-white pb-16 sm:pb-20">
      <Container>
        <div className={clothing ? "grid gap-6 lg:grid-cols-[1fr_1.4fr]" : ""}>
          {clothing ? <div className="flex items-center justify-center rounded-[28px] p-8" style={pastelStyle(index)}>
            <figure className="w-full max-w-[250px]">
              <div className="overflow-hidden rounded-[2rem] border-[5px] border-white/70 shadow-2xl"><Image src="/site/velira-mobile.png" alt="VELIRA giyim demosunun gerçek mobil ekranı: kategori menüsü, öne çıkan elbiseler ve sepete ekleme düğmeleri" width={390} height={844} sizes="250px" priority className="h-auto w-full" /></div>
              <figcaption className="mt-4 text-center text-xs text-brand-navy/70">VELIRA demosundan gerçek mobil ekran.</figcaption>
            </figure>
          </div> : null}
          <TintBox index={clothing ? index + 1 : index}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/60">Örnek kullanım</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-4xl">{sector.example.title}</h2>
            <p className="mt-4 leading-relaxed text-brand-navy/70">{sector.example.body}</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {sector.example.steps.map((step, i) => <li key={step} className="rounded-2xl bg-white/80 p-4 text-sm leading-relaxed text-brand-navy"><span className="mb-2 block text-2xl font-extrabold tracking-[-0.03em] text-brand-navy">0{i + 1}</span>{step}</li>)}
            </ol>
          </TintBox>
        </div>
      </Container>
    </section>

    <section className="bg-white pb-16 sm:pb-20">
      <Container>
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">{sector.shortName} için öne çıkan araçlar</h2>
        <div className="mt-9 grid gap-6 lg:grid-cols-3">
          {sector.benefits.map((benefit, i) => <BandCard key={benefit.title} index={index + i + 1} href={`/ozellikler/${benefit.href}`} band={<h3 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy">{benefit.title}</h3>}>
            <p className="flex-1 leading-relaxed text-brand-muted">{benefit.body}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">Özelliği incele <ArrowRight className="size-4" aria-hidden /></span>
          </BandCard>)}
        </div>
      </Container>
    </section>

    <section className="bg-white pb-16 sm:pb-20">
      <Container className="grid gap-6 lg:grid-cols-2">
        <TintBox index={index + 2}>
          <Languages className="size-8 text-brand-navy" aria-hidden />
          <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.02em] text-brand-navy sm:text-3xl">Yabancı müşterileriniz için İngilizce, Almanca ve Rusça</h2>
          <p className="mt-3 leading-relaxed text-brand-navy/70">Müşterileriniz dil menüsünden tercih ettikleri dili seçerek kataloğunuzu kullanabilir.</p>
          <div className="mt-5 flex flex-wrap gap-2">{["İngilizce", "Almanca", "Rusça"].map(language => <span key={language} className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-navy">{language}</span>)}</div>
        </TintBox>
        <div className="rounded-[28px] bg-brand-dark p-7 text-white sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-neon">{sector.demo?.name ?? "Genel toptancı demosu"}</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">{sector.demo ? "Giyim kataloğunu gerçek demo üzerinden keşfedin." : "Bayi kataloğu ve sipariş akışını deneyin."}</h2>
          <p className="mt-3 leading-relaxed text-white/70">{sector.demo?.description ?? "Genel toptancı demomuzdan katalog erişimini, ürün aramayı ve sepet akışını inceleyin. Kendi kataloğunuzu sektörünüzün ürünleriyle oluşturursunuz."}</p>
          {!sector.demo && <p className="mt-4 text-sm text-white/70">Demo giriş şifresi: <span className="font-plex-mono text-white">{SITE.demoPassword}</span></p>}
          <div className="mt-6"><ButtonLink href={sector.demo?.url ?? SITE.demoUrl} external>{sector.demo ? "Giyim demosunu incele" : "Demoyu incele"} <ArrowUpRight className="size-4" aria-hidden /></ButtonLink></div>
        </div>
        {clothing && <figure className="min-w-0 lg:col-span-2"><div className="overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-lg"><div className="flex items-center gap-2 border-b border-brand-line px-4 py-3"><span className="size-2 rounded-full bg-brand-line" /><span className="size-2 rounded-full bg-brand-line" /><span className="size-2 rounded-full bg-brand-line" /><span className="ml-2 truncate text-xs text-brand-muted">demo-giyim.ekatalox.com</span></div><Image src="/site/velira-desktop.png" alt="VELIRA giyim demosunun masaüstü görünümü: koleksiyon bannerı, ürün arama, kategori görselleri ve sepet" width={1272} height={716} sizes="(max-width: 768px) 100vw, 1100px" className="h-auto w-full" /></div><figcaption className="mt-4 text-sm text-brand-muted">VELIRA demosunun gerçek masaüstü ekranı. Görsellerdeki ürünler, fiyatlar ve kampanyalar demo içeriğidir.</figcaption></figure>}
      </Container>
    </section>

    <section className="bg-white pb-16 sm:pb-20">
      <Container className="max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">{sector.shortName} hakkında</h2>
        <div className="mt-8"><FaqList items={faq} /></div>
        {sector.slug === "gida-toptancilari" && <p className="mt-6 text-center"><Link href="/sektorler/market-bakkal" className="font-semibold text-brand-green hover:underline">Market & Bakkallar çözümünü incele →</Link></p>}
      </Container>
    </section>

    <section className="bg-white pb-8">
      <Container>
        <h2 className="text-center text-2xl font-extrabold tracking-[-0.02em] text-brand-navy">Diğer sektörleri keşfedin</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {WHOLESALE_SECTORS.filter(item => item.slug !== sector.slug).map((item, i) => <Link key={item.slug} href={`/sektorler/${item.slug}`} className="rounded-full px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:-translate-y-0.5" style={pastelStyle(i)}>{item.shortName} →</Link>)}
          <Link href="/sektorler/market-bakkal" className="rounded-full border border-brand-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:border-brand-navy">Market & Bakkallar →</Link>
        </div>
      </Container>
    </section>
    <CustomerMarquee />
    <ClosingCta title="Ürünlerinizi ekleyin, kataloğunuzu paylaşın." lead="250 ürünle ücretsiz başlayın. Daha fazla ürün, raporlar ve bildirimler için paketleri inceleyin." primaryHref={`/basvuru?sektor=${sector.registration}`} index={index} secondary={<Link href="/fiyatlandirma?gorunum=toptanci" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-brand-navy hover:bg-brand-paper">Toptancı paketlerini gör</Link>} />
  </>;
}
