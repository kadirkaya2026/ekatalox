// Çok sayfalı kurumsal site: Markalar (bkz. components/kurumsal/kurumsal-pro.tsx).
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalProBrands } from "@/components/kurumsal/kurumsal-pro";
import { getKurumsalProContext, kurumsalProMetadata } from "@/lib/kurumsal/pro-page";
import { getKurumsalDataCached } from "@/lib/storefront/kurumsal-data";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) return {};
  return kurumsalProMetadata(ctx, { title: "Markalar", path: "/markalar" });
}

export default async function Page(props: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalProContext(subdomain);
  if (!ctx) notFound();
  const data = await getKurumsalDataCached(ctx.tenant.id);
  return <KurumsalProBrands ctx={ctx} data={data} />;
}
