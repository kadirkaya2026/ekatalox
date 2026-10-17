// Çok sayfalı kurumsal site: Hakkımızda (bkz. components/kurumsal/kurumsal-pro.tsx).
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalProAbout } from "@/components/kurumsal/kurumsal-pro";
import { getKurumsalProContext, kurumsalProMetadata } from "@/lib/kurumsal/pro-page";
import { getKurumsalDataCached } from "@/lib/storefront/kurumsal-data";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) return {};
  return kurumsalProMetadata(ctx, { title: "Hakkımızda", path: "/hakkimizda", description: ctx.content.about[0] });
}

export default async function Page(props: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) notFound();
  const data = await getKurumsalDataCached(ctx.tenant.id);
  return <KurumsalProAbout ctx={ctx} data={data} />;
}
