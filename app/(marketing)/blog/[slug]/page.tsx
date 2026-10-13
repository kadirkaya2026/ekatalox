import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts, getRelatedPosts, readingMinutes, blogDate } from "@/lib/marketing/blog";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { ButtonLink, Container, Section } from "@/components/marketing/ui";
import { BandCard, Breadcrumb, PageHero, TintBox, pastelStyle } from "@/components/marketing/home-v2/page-kit";

type Props = { params: Promise<{ slug: string }> };
// İleri tarihli yazılar (publishedAt) o gün gelince yeniden yayın gerekmeden açılsın: saatlik yenileme.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() { return getBlogPosts().map(({ slug }) => ({ slug })); }
async function resolvePost(params: Props["params"]) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return post;
}
export async function generateMetadata({ params }: Props) {
  const post = await resolvePost(params);
  const base = marketingMetadata(`/blog/${post.slug}`, post.title, post.description);
  const image = `${SITE.url}/blog/${post.slug}/paylasim`;
  return {
    ...base,
    openGraph: { ...base.openGraph, type: "article", publishedTime: `${post.publishedAt}T00:00:00+03:00`, ...(post.updatedAt ? { modifiedTime: `${post.updatedAt}T00:00:00+03:00` } : {}), authors: ["Kadir Kaya"], images: [{ url: image, width: 1200, height: 630, alt: post.title }] },
    twitter: { ...base.twitter, images: [image] },
  };
}
export default async function ArticlePage({ params }: Props) {
  const post = await resolvePost(params);
  const related = getRelatedPosts(post);
  const url = `${SITE.url}/blog/${post.slug}`;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "BlogPosting", "@id": `${url}#article`, headline: post.title, description: post.description, mainEntityOfPage: url, url, inLanguage: "tr-TR", datePublished: `${post.publishedAt}T00:00:00+03:00`, ...(post.updatedAt ? { dateModified: `${post.updatedAt}T00:00:00+03:00` } : {}), image: `${url}/paylasim`, author: { "@type": "Person", name: "Kadir Kaya", url: `${SITE.url}/hakkimizda`, worksFor: { "@type": "Organization", name: SITE.name, url: SITE.url } }, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: `${SITE.url}/ekatalox-logo-rgb-v2.png` } } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ] },
  ] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <PageHero
      breadcrumb={<Breadcrumb items={[{ href: "/", label: "Ana sayfa" }, { href: "/blog", label: "Blog" }, { label: post.category }]} />}
      eyebrow={post.category}
      title={post.title}
      lead={post.description}
      className="pb-8 sm:pb-10"
    >
      <div className="mt-7 flex flex-wrap justify-center gap-2 text-sm text-brand-muted">
        <span className="rounded-full border border-brand-line bg-white px-3 py-1.5">Yazar: <Link href="/hakkimizda" rel="author" className="font-semibold text-brand-navy hover:underline">Kadir Kaya</Link></span>
        <span className="rounded-full border border-brand-line bg-white px-3 py-1.5">Yayın: <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></span>
        {post.updatedAt && <span className="rounded-full border border-brand-line bg-white px-3 py-1.5">Güncelleme: <time dateTime={post.updatedAt}>{blogDate(post.updatedAt)}</time></span>}
        <span className="rounded-full border border-brand-line bg-white px-3 py-1.5">{readingMinutes(post)} dk okuma</span>
      </div>
    </PageHero>
    <Section tone="white" className="pt-0 sm:pt-0">
      <Container className="grid items-start gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="İçindekiler" className="rounded-[24px] p-5 lg:sticky lg:top-24" style={pastelStyle(0)}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/60">Bu rehberde</h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">{post.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="font-medium text-brand-navy/80 hover:text-brand-navy hover:underline">{index + 1}. {section.title}</a></li>)}</ol>
        </nav>
        <article className="min-w-0 max-w-[70ch]">
          {post.sections.map((section) => <section key={section.id} id={section.id} className="mb-12 scroll-mt-28 last:mb-0">
            <h2 className="text-2xl font-semibold leading-snug tracking-tight text-brand-navy">{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-[17px] leading-[1.85] text-brand-muted"><InlineLinks text={paragraph} /></p>)}
            {section.bullets && <ul className="mt-5 list-disc space-y-3 pl-5 text-[17px] leading-relaxed text-brand-muted">{section.bullets.map((item) => <li key={item}><InlineLinks text={item} /></li>)}</ul>}
            {section.images && <div className={section.images.length > 1 ? "mt-6 grid gap-4 sm:grid-cols-2" : "mt-6"}>{section.images.map((image) => <figure key={image.src} className="overflow-hidden rounded-2xl border border-brand-line bg-brand-paper">
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full" />
              {image.caption && <figcaption className="px-4 py-3 text-sm leading-relaxed text-brand-muted">{image.caption}</figcaption>}
            </figure>)}</div>}
            {section.download && <div className="mt-6 rounded-2xl border border-brand-green/40 bg-brand-paper p-5">
              <a href={section.download.href} download className="font-semibold text-brand-green hover:underline">{section.download.label} ↓</a>
              {section.download.note && <p className="mt-2 text-sm leading-relaxed text-brand-muted">{section.download.note}</p>}
            </div>}
          </section>)}
          <TintBox index={2} className="mt-12">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-brand-navy">Kendi kataloğunuzda uygulayın</h2>
            <ul className="mt-4 space-y-2">{post.featureLinks.map((link) => <li key={link.href}><Link href={link.href} className="font-semibold text-brand-navy underline underline-offset-4 hover:no-underline">{link.label} →</Link></li>)}</ul>
            <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/basvuru" tone="navy">Ücretsiz başla</ButtonLink><ButtonLink href="/fiyatlandirma" tone="white">Paketleri incele</ButtonLink></div>
          </TintBox>
        </article>
      </Container>
    </Section>
    {related.length > 0 && <section className="bg-white pb-20"><Container><h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">İlgili rehberler</h2><div className="mt-8 grid gap-6 md:grid-cols-3">{related.map((item, i) => <BandCard key={item.slug} index={i + 1} href={`/blog/${item.slug}`} band={<span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-navy">{item.category}</span>}><h3 className="text-xl font-extrabold leading-snug tracking-[-0.02em] text-brand-navy">{item.title}</h3><p className="mt-3 flex-1 text-sm leading-relaxed text-brand-muted">{item.description}</p></BandCard>)}</div></Container></section>}
  </>;
}

// Metin içi bağlantı (10 Eki 2026, iç linkleme): "[metin](/adres)" → site içi Link.
// Yalnız "/" ile başlayan adresler; dış adres yazılırsa düz metin kalır.
function InlineLinks({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(
      <Link key={index} href={match[2]} className="font-medium text-brand-green underline decoration-brand-green/30 underline-offset-2 hover:decoration-brand-green">
        {match[1]}
      </Link>,
    );
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
