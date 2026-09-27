import Link from "next/link";
import { notFound } from "next/navigation";
import { MARKETING_FEATURES } from "@/lib/marketing/features";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { ButtonLink, Container, Section } from "@/components/marketing/ui";

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
  return marketingMetadata(`/ozellikler/${feature.slug}`, feature.title, feature.lead);
}
export default async function FeaturePage({ params }: Props) {
  const feature = await getFeature(params);
  const payment = feature.slug === "online-odeme";
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Özellikler", item: `${SITE.url}/ozellikler` },
      { "@type": "ListItem", position: 3, name: feature.title, item: `${SITE.url}/ozellikler/${feature.slug}` },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
    <Section tone="navy" glow className="py-12 sm:py-16">
      <Container>
        <nav aria-label="Sayfa yolu" className="mb-8 text-sm text-white/70">
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            <li><Link href="/" className="hover:underline">Ana sayfa</Link><span aria-hidden> /</span></li>
            <li><Link href="/ozellikler" className="hover:underline">Özellikler</Link><span aria-hidden> /</span></li>
            <li aria-current="page">{feature.title}</li>
          </ol>
        </nav>
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{feature.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/75">{feature.lead}</p>
        <p className="mt-5 max-w-3xl text-sm font-medium text-brand-neon">{feature.plan}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={payment ? "/iletisim" : "/basvuru"}>{payment ? "Entegrasyon için görüşelim" : "Ücretsiz başla"}</ButtonLink>
          <ButtonLink href="/fiyatlandirma" tone="outline-dark">Paketleri karşılaştır</ButtonLink>
        </div>
      </Container>
    </Section>
    <Section tone="white">
      <Container className="grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-16">
        <div className="space-y-10">
          {feature.sections.map((section) => <section key={section.title}>
            <h2 className="text-2xl font-semibold tracking-tight text-brand-navy">{section.title}</h2>
            <p className="mt-3 leading-relaxed text-brand-muted">{section.body}</p>
          </section>)}
        </div>
        <aside className="self-start rounded-2xl border border-brand-line bg-brand-paper p-6 sm:p-8 lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold text-brand-navy">İşletmenizde nasıl kullanırsınız?</h2>
          <p className="mt-4 leading-relaxed text-brand-muted">{feature.example}</p>
          <Link href="/nasil-calisir" className="mt-6 inline-block font-semibold text-brand-green hover:underline">Kurulum adımlarını inceleyin →</Link>
        </aside>
      </Container>
    </Section>
    <Section>
      <Container>
        <h2 className="text-2xl font-semibold text-brand-navy">Birlikte kullanabileceğiniz özellikler</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {feature.related.map((slug) => {
            const item = MARKETING_FEATURES.find((f) => f.slug === slug)!;
            return <Link key={slug} href={`/ozellikler/${slug}`} className="rounded-2xl border border-brand-line bg-white p-6 transition-colors hover:border-brand-green">
              <h3 className="font-semibold text-brand-navy">{item.title} →</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.lead}</p>
            </Link>;
          })}
        </div>
      </Container>
    </Section>
  </>;
}
