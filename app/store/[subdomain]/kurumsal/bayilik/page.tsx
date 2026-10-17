// Çok sayfalı kurumsal site: Bayilik (bkz. components/kurumsal/kurumsal-pro.tsx).
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalProDealer } from "@/components/kurumsal/kurumsal-pro";
import { getKurumsalProContext, kurumsalProMetadata } from "@/lib/kurumsal/pro-page";


export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) return {};
  return kurumsalProMetadata(ctx, { title: "Bayilik", path: "/bayilik", description: `${ctx.tenant.company_name} bayisi olun: size özel fiyat listesi ve 7/24 bayi portalı.` });
}

export default async function Page(props: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) notFound();
  return <KurumsalProDealer ctx={ctx} />;
}
