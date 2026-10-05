import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts, getRelatedPosts, readingMinutes, blogDate } from "@/lib/marketing/blog";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { ButtonLink, Container, Section } from "@/components/marketing/ui";

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
    <Section tone="navy" glow className="py-12 sm:py-16">
      <Container>
        <nav aria-label="Sayfa yolu" className="text-sm text-white/65"><ol className="flex flex-wrap gap-2"><li><Link href="/" className="hover:underline">Ana sayfa</Link><span aria-hidden> /</span></li><li><Link href="/blog" className="hover:underline">Blog</Link><span aria-hidden> /</span></li><li aria-current="page">{post.title}</li></ol></nav>
        <p className="mt-8 text-sm font-semibold text-brand-neon">{post.category}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/75">{post.description}</p>
        <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/65"><span>Yazar: <Link href="/hakkimizda" rel="author" className="text-white hover:underline">Kadir Kaya</Link></span><span>Yayın: <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></span>{post.updatedAt && <span>Güncelleme: <time dateTime={post.updatedAt}>{blogDate(post.updatedAt)}</time></span>}<span>{readingMinutes(post)} dk okuma</span></div>
      </Container>
    </Section>
    <Section tone="white">
      <Container className="grid items-start gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="İçindekiler" className="rounded-2xl border border-brand-line bg-brand-paper p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-brand-navy">Bu rehberde</h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">{post.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="text-brand-muted hover:text-brand-green">{index + 1}. {section.title}</a></li>)}</ol>
        </nav>
        <article className="min-w-0 max-w-[70ch]">
          {post.sections.map((section) => <section key={section.id} id={section.id} className="mb-12 scroll-mt-28 last:mb-0">
            <h2 className="text-2xl font-semibold leading-snug tracking-tight text-brand-navy">{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-[17px] leading-[1.85] text-brand-muted">{paragraph}</p>)}
            {section.bullets && <ul className="mt-5 list-disc space-y-3 pl-5 text-[17px] leading-relaxed text-brand-muted">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.images && <div className={section.images.length > 1 ? "mt-6 grid gap-4 sm:grid-cols-2" : "mt-6"}>{section.images.map((image) => <figure key={image.src} className="overflow-hidden rounded-2xl border border-brand-line bg-brand-paper">
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full" />
              {image.caption && <figcaption className="px-4 py-3 text-sm leading-relaxed text-brand-muted">{image.caption}</figcaption>}
            </figure>)}</div>}
            {section.download && <div className="mt-6 rounded-2xl border border-brand-green/40 bg-brand-paper p-5">
              <a href={section.download.href} download className="font-semibold text-brand-green hover:underline">{section.download.label} ↓</a>
              {section.download.note && <p className="mt-2 text-sm leading-relaxed text-brand-muted">{section.download.note}</p>}
            </div>}
          </section>)}
          <aside className="mt-12 rounded-2xl border border-brand-line bg-brand-paper p-6">
            <h2 className="text-xl font-semibold text-brand-navy">Kendi kataloğunuzda uygulayın</h2>
            <ul className="mt-4 space-y-3">{post.featureLinks.map((link) => <li key={link.href}><Link href={link.href} className="font-medium text-brand-green hover:underline">{link.label} →</Link></li>)}</ul>
            <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/basvuru">Ücretsiz başla</ButtonLink><ButtonLink href="/fiyatlandirma" tone="outline">Paketleri incele</ButtonLink></div>
          </aside>
        </article>
      </Container>
    </Section>
    {related.length > 0 && <Section><Container><h2 className="text-2xl font-semibold text-brand-navy">İlgili rehberler</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{related.map((item) => <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl border border-brand-line bg-white p-6 hover:border-brand-green"><h3 className="font-semibold text-brand-navy">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.description}</p></Link>)}</div></Container></Section>}
  </>;
}
