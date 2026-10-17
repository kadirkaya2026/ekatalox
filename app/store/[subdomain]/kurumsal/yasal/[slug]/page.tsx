// Çok sayfalı kurumsal site: yasal sayfalar (content.legal_pages; KVKK,
// gizlilik, mesafeli satış…). Metin firmanın kendi metni, sanitize edilerek basılır.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalProLegal } from "@/components/kurumsal/kurumsal-pro";
import { getKurumsalProContext, kurumsalProMetadata } from "@/lib/kurumsal/pro-page";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ subdomain: string; slug: string }> }): Promise<Metadata> {
  const { subdomain, slug } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  const page = ctx?.content.legal_pages?.find((item) => item.slug === slug);
  if (!ctx || !page) return {};
  return kurumsalProMetadata(ctx, { title: page.title, path: `/yasal/${page.slug}` });
}

export default async function Page(props: { params: Promise<{ subdomain: string; slug: string }> }) {
  const { subdomain, slug } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  const page = ctx?.content.legal_pages?.find((item) => item.slug === slug);
  if (!ctx || !page) notFound();
  return <KurumsalProLegal ctx={ctx} page={page} />;
}
