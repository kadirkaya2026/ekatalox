import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBlogPosts, readingMinutes, blogDate } from "@/lib/marketing/blog";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { Container } from "@/components/marketing/ui";
import { Accent, BandCard, ClosingCta, PageHero } from "@/components/marketing/home-v2/page-kit";
// İleri tarihli yazılar listeye o gün gelince girsin.
export const revalidate = 3600;
export const metadata = marketingMetadata("/blog", "Toptancılar için Katalog ve Sipariş Rehberleri", "Dijital katalog, PDF katalog, bayi fiyat listeleri ve WhatsApp sipariş hakkında uygulamalı rehberler. Ürünlerinizi online sunmanın yollarını keşfedin.");
export default function BlogPage() {
  const posts = getBlogPosts();
  return <>
    <PageHero eyebrow="eKatalox blog" title={<>Kataloğunuz daha anlaşılır. <Accent>Siparişleriniz daha düzenli.</Accent></>} lead="PDF'den online kataloğa geçiş, bayi fiyatları ve sipariş toplama üzerine pratik rehberler. İşletmenize uygun adımları keşfedin." />
    <section className="bg-white pb-8">
      <Container>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post, i) => <BandCard key={post.slug} index={i} href={`/blog/${post.slug}`} band={<div className="flex w-full items-end justify-between gap-4"><span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-navy">{post.category}</span><span className="text-xs font-semibold text-brand-navy/70">{readingMinutes(post)} dk okuma</span></div>}>
            <h2 className="text-2xl font-extrabold leading-snug tracking-[-0.02em] text-brand-navy">{post.title}</h2>
            <p className="mt-3 flex-1 leading-relaxed text-brand-muted">{post.description}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><time dateTime={post.publishedAt} className="text-sm text-brand-muted">{blogDate(post.publishedAt)}</time><span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green">Rehberi oku <ArrowUpRight className="size-4" aria-hidden /></span></div>
          </BandCard>)}
        </div>
      </Container>
    </section>
    <ClosingCta title="Okuduklarınızı kendi kataloğunuzda deneyin." lead="Ürünlerinizi ekleyin, bayi fiyatlarınızı belirleyin, bağlantınızı paylaşın." index={0} secondary={<Link href="/nasil-calisir" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-brand-navy hover:bg-brand-paper">Nasıl çalışır?</Link>} />
  </>;
}
