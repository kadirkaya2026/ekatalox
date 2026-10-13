import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MARKETING_FEATURES } from "@/lib/marketing/features";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { ButtonLink, Container } from "@/components/marketing/ui";
import { BandCard, Breadcrumb, ClosingCta, CustomerMarquee, FaqList, PageHero, TintBox } from "@/components/marketing/home-v2/page-kit";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return MARKETING_FEATURES.map(({ slug }) => ({ slug }));
}
async function getFeature(params: Props["params"]) {
  const { slug } = await params;
  const feature = MARKETING_FEATURES.find((item) => item.slug === slug);
  if (!feature) notFound();
  return feature;
}
export async function generateMetadata({ params }: Props) {
  const feature = await getFeature(params);
  return marketingMetadata(`/ozellikler/${feature.slug}`, feature.seoTitle, feature.metaDescription);
}

// TASLAK (14 Eki 2026): özellik alt sayfası Beacons dilinde; veri ve şema aynı.
export default async function FeaturePage({ params }: Props) {
  const feature = await getFeature(params);
  const payment = feature.slug === "online-odeme";
  const cta = feature.cta ?? (payment ? { href: "/iletisim", label: "Entegrasyon için görüşelim" } : { href: "/basvuru", label: "Ücretsiz başla" });
  const faqLd = feature.faq?.length ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: feature.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  } : null;
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Özellikler", item: `${SITE.url}/ozellikler` },
      { "@type": "ListItem", position: 3, name: feature.title, item: `${SITE.url}/ozellikler/${feature.slug}` },
    ],
  };
  const index = Math.max(0, MARKETING_FEATURES.findIndex((f) => f.slug === feature.slug));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
    {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} /> : null}

    <PageHero
      breadcrumb={<Breadcrumb items={[{ href: "/", label: "Ana sayfa" }, { href: "/ozellikler", label: "Özellikler" }, { label: feature.title }]} />}
      eyebrow={feature.plan}
      title={feature.title}
      lead={feature.lead}
      actions={<><ButtonLink href={cta.href} tone="navy" size="lg" className="px-9" external={cta.href.startsWith("http")}>{cta.label}</ButtonLink><ButtonLink href="/fiyatlandirma" tone="outline" size="lg">Paketleri karşılaştır</ButtonLink></>}
    />

    <section className="bg-white pb-16 sm:pb-20">
      <Container className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
        <TintBox index={index} className="self-start lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/60">İşletmenizde nasıl kullanırsınız?</p>
          <p className="mt-4 text-lg leading-relaxed text-brand-navy">{feature.example}</p>
          <Link href="/nasil-calisir" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy">
            Kurulum adımları <ArrowRight className="size-4" aria-hidden />
          </Link>
        </TintBox>
        <div className="divide-y divide-brand-line">
          {feature.sections.map((section) => <section key={section.title} className="py-8 first:pt-0 last:pb-0">
            <h2 className="text-2xl font-extrabold leading-snug tracking-[-0.02em] text-brand-navy sm:text-3xl">{section.title}</h2>
            <p className="mt-3 text-[17px] leading-relaxed text-brand-muted">{section.body}</p>
          </section>)}
        </div>
      </Container>
    </section>

    {feature.faq?.length ? <section className="bg-white pb-16 sm:pb-20">
      <Container className="max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">Sık sorulanlar</h2>
        <div className="mt-8"><FaqList items={feature.faq} /></div>
      </Container>
    </section> : null}

    <section className="bg-white pb-8">
      <Container>
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">Birlikte kullanabileceğiniz özellikler</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {feature.related.map((slug, i) => {
            const item = MARKETING_FEATURES.find((f) => f.slug === slug)!;
            return <BandCard key={slug} index={index + i + 1} href={`/ozellikler/${slug}`} band={<h3 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy">{item.title}</h3>}>
              <p className="flex-1 text-[15px] leading-relaxed text-brand-muted">{item.lead}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">Ayrıntıları inceleyin <ArrowRight className="size-4" aria-hidden /></span>
            </BandCard>;
          })}
        </div>
      </Container>
    </section>
    <CustomerMarquee />
    <ClosingCta title="Ücretsiz planla başlayın, gerisini kullanırken görün." lead="250 ürün, 2 fiyat listesi, WhatsApp'ta PDF fiş. Kart istenmez, komisyon yok." primaryHref={cta.href} primaryLabel={cta.label} index={index} secondary={<Link href="/fiyatlandirma" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-brand-navy hover:bg-brand-paper">Paketleri karşılaştır</Link>} />
  </>;
}
