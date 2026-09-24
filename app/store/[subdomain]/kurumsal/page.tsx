// Kurumsal site ana sayfası: tenant'ın KENDİ kök alan adında (ör.
// lucatech.com.tr, tenants.kurumsal_domain) proxy.ts'in "/" isteğini buraya
// yeniden yazmasıyla açılır; şifre kapısı yok, bilerek Google'a açık. Yalnız
// "kurumsal_site" paketinde ve alan adı bağlıyken yayınlanır. Fiyat
// göstermez; ürünleri fiyatsız katalogdan listeler, "Bayi Girişi" ile
// şifreli vitrine, "Bayimiz Olun" ile başvuru formuna (#basvuru) ya da
// WhatsApp'a yönlendirir. İçerik panelde "Ayarlar → Kurumsal Site"
// sihirbazıyla doldurulur (tenant_kurumsal_sites); yayında değilse 404.
// ISR: çerez okumaz; katalog/ayar değişince storefront_{tenantId} tag'i
// ve revalidateStorefrontCache bu yolu tazeler.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalView } from "@/components/kurumsal/kurumsal-view";
import { getKurumsalPageContext } from "@/lib/kurumsal/page-context";
import { getKurumsalDataCached } from "@/lib/storefront/kurumsal-data";
import { buildStorefrontIcons } from "@/lib/storefront/white-label";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/kurumsal">,
): Promise<Metadata> {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalPageContext(subdomain);
  if (!ctx) return {};

  const { tenant, settings, content } = ctx;
  const description =
    content.tagline || settings.storefront_description || `${tenant.company_name} kurumsal sayfası`;

  const ogImage = ctx.heroImage
    ? new URL(ctx.heroImage, ctx.kurumsalOrigin).toString()
    : (settings.logo_url ?? undefined);

  return {
    // Kurumsal sayfa bayinin kendi sitesi: "| eKatalox" eki hiç eklenmez.
    title: { absolute: `${tenant.company_name} | ${content.eyebrow || "Kurumsal"}` },
    description,
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    alternates: { canonical: `${ctx.kurumsalOrigin}/` },
    openGraph: {
      type: "website",
      url: `${ctx.kurumsalOrigin}/`,
      siteName: tenant.company_name,
      title: tenant.company_name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function KurumsalPage(props: PageProps<"/store/[subdomain]/kurumsal">) {
  const { subdomain } = await props.params;
  const ctx = await getKurumsalPageContext(subdomain);
  if (!ctx) notFound();

  const data = await getKurumsalDataCached(ctx.tenant.id);

  return (
    <KurumsalView
      tenantName={ctx.tenant.company_name}
      subdomain={subdomain}
      logoUrl={ctx.settings.logo_url}
      wordmark={ctx.wordmark}
      accent={ctx.accent}
      heroImage={ctx.heroImage}
      content={ctx.content}
      contact={ctx.contact}
      data={data}
      isWhiteLabel={ctx.isWhiteLabel}
      catalogUrl={ctx.catalogUrl}
    />
  );
}
