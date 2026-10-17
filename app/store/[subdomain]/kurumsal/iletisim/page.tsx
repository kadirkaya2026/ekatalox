// Çok sayfalı kurumsal site: İletişim (bkz. components/kurumsal/kurumsal-pro.tsx).
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalProContact } from "@/components/kurumsal/kurumsal-pro";
import { getKurumsalProContext, kurumsalProMetadata } from "@/lib/kurumsal/pro-page";


export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) return {};
  return kurumsalProMetadata(ctx, { title: "İletişim", path: "/iletisim" });
}

export default async function Page(props: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) notFound();
  return <KurumsalProContact ctx={ctx} />;
}
