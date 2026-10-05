import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { getBlogPosts, readingMinutes, blogDate } from "@/lib/marketing/blog";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { ButtonLink, Container, Section } from "@/components/marketing/ui";

// İleri tarihli yazılar listeye o gün gelince girsin.
export const revalidate = 3600;

export const metadata = marketingMetadata("/blog", "Toptancılar için Katalog ve Sipariş Rehberleri", "Dijital katalog, PDF katalog, bayi fiyat listeleri ve WhatsApp sipariş hakkında uygulamalı rehberler. Ürünlerinizi online sunmanın yollarını keşfedin.");

export default function BlogPage() {
  const posts = getBlogPosts();
  return <>
    <Section tone="navy" glow className="py-14 sm:py-20">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-neon">eKatalox Blog</p>
        <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Kataloğunuz daha anlaşılır.<br />Siparişleriniz daha düzenli.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">PDF’den online kataloğa geçiş, bayi fiyatları ve sipariş toplama üzerine pratik rehberler. İşletmenize uygun adımları keşfedin.</p>
      </Container>
    </Section>
    <Section tone="white">
      <Container>
        <div className="mb-8 flex items-center gap-3"><BookOpen className="size-5 text-brand-green" aria-hidden /><h2 className="text-2xl font-semibold text-brand-navy">Katalog rehberleri</h2></div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => <article key={post.slug} className="flex flex-col rounded-2xl border border-brand-line bg-brand-paper p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-brand-muted"><span className="font-semibold text-brand-green">{post.category}</span><span>·</span><span>{readingMinutes(post)} dk okuma</span></div>
            <h3 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-brand-navy"><Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link></h3>
            <p className="mt-4 leading-relaxed text-brand-muted">{post.description}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-7"><time dateTime={post.publishedAt} className="text-sm text-brand-muted">{blogDate(post.publishedAt)}</time><Link href={`/blog/${post.slug}`} aria-label={`${post.title} yazısını oku`} className="inline-flex items-center gap-1 font-semibold text-brand-green">Rehberi oku <ArrowUpRight className="size-4" aria-hidden /></Link></div>
          </article>)}
        </div>
      </Container>
    </Section>
    <Section>
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div><h2 className="text-2xl font-semibold text-brand-navy">Okuduklarınızı kendi kataloğunuzda deneyin.</h2><p className="mt-3 text-brand-muted">Ürünlerinizi ekleyin, bayi fiyatlarınızı belirleyin, bağlantınızı paylaşın.</p></div>
        <ButtonLink href="/basvuru">Ücretsiz başla</ButtonLink>
      </Container>
    </Section>
  </>;
}
