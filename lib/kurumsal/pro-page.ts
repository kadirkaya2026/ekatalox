import type { Metadata } from "next";
import { getKurumsalPageContext, type KurumsalPageContext } from "@/lib/kurumsal/page-context";
import { buildStorefrontIcons } from "@/lib/storefront/white-label";

// Çok sayfalı kurumsal sitenin alt sayfaları (/hakkimizda, /urunler, /markalar,
// /bayilik, /iletisim, /yasal/[slug]) için ortak bağlam ve başlık bilgisi.
// Site tek sayfalıysa (content.layout !== "pages") bu sayfalar yoktur → null.

export async function getKurumsalProContext(subdomain: string): Promise<KurumsalPageContext | null> {
  const ctx = await getKurumsalPageContext(subdomain);
  return ctx && ctx.content.layout === "pages" ? ctx : null;
}

export function kurumsalProMetadata(
  ctx: KurumsalPageContext,
  params: { title: string; path: string; description?: string | null },
): Metadata {
  const { tenant, settings, content } = ctx;
  const url = `${ctx.kurumsalOrigin}${params.path}`;
  const description = params.description || content.tagline || `${tenant.company_name} kurumsal sayfası`;
  const ogImage = ctx.heroImage ? new URL(ctx.heroImage, ctx.kurumsalOrigin).toString() : (settings.logo_url ?? undefined);
  return {
    title: { absolute: `${params.title} | ${tenant.company_name}` },
    description,
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: tenant.company_name,
      title: `${params.title} | ${tenant.company_name}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
