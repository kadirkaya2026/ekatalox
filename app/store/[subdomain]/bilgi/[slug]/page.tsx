// Mağaza bilgi sayfaları (0155, retail_config.info_display = "pages"): Hakkımızda,
// Neden Biz, Sipariş Süresi… Her bölüm /bilgi/<slug>; footer'dan bağlanır.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPageView } from "@/components/storefront/info-page-view";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { resolveRetailConfig } from "@/lib/storefront/retail-config";
import { buildStorefrontIcons, buildStorefrontTitle } from "@/lib/storefront/white-label";

type InfoPageProps = { params: Promise<{ subdomain: string; slug: string }> };

async function load(props: InfoPageProps) {
  const { subdomain, slug } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active") return null;
  const settings = await getTenantStorefrontSettings(tenant.id);
  const retail = resolveRetailConfig(settings.retail_config);
  const page = retail.infoAsPages ? retail.infoSections.find((s) => s.slug === slug) : undefined;
  return page ? { tenant, settings, retail, page } : null;
}

export async function generateMetadata(props: InfoPageProps): Promise<Metadata> {
  const data = await load(props);
  if (!data) return {};
  return {
    title: buildStorefrontTitle(data.page.title, data.tenant),
    description: data.page.body.slice(0, 160),
    icons: buildStorefrontIcons(data.settings.site_favicon_url, data.tenant),
  };
}

export default async function InfoPage(props: InfoPageProps) {
  const data = await load(props);
  if (!data) notFound();
  const { tenant, settings, retail, page } = data;
  const digits = (tenant.whatsapp_number ?? "").replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `9${digits}` : digits.startsWith("90") ? digits : digits ? `90${digits}` : "";
  return (
    <InfoPageView
      tenantName={settings.storefront_title?.trim() || tenant.company_name}
      logoUrl={settings.logo_url ?? null}
      brandColor={settings.brand_primary_color ?? "#b8456a"}
      page={page}
      pages={retail.infoSections.map((s) => ({ slug: s.slug, title: s.title, emoji: s.emoji }))}
      menuTitle={retail.menuBuilder?.title ?? null}
      whatsappHref={intl ? `https://wa.me/${intl}` : null}
    />
  );
}
