import { getKurumsalPageContext } from "@/lib/kurumsal/page-context";
import { getKurumsalSitemapCached } from "@/lib/storefront/kurumsal-data";

// Kurumsal sitenin sitemap'i: alan adı modunda /sitemap.xml, platform
// adresinde /kurumsal/sitemap.xml (proxy.ts bu yola yeniden yazar):
// ana sayfa + kategori sayfaları + ürün sayfaları. Pazarlama sitemap'i
// (app/sitemap.ts) ayrı ve değişmedi.

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(_request: Request, ctx: RouteContext<"/store/[subdomain]/kurumsal/sitemap">) {
  const { subdomain } = await ctx.params;
  const page = await getKurumsalPageContext(subdomain);
  if (!page) return new Response("Not Found", { status: 404 });

  const { categoryIds, productIds } = await getKurumsalSitemapCached(page.tenant.id);
  const origin = page.kurumsalOrigin;
  const entries: Array<{ loc: string; priority: string; changefreq: string }> = [
    { loc: page.homeUrl, priority: "1.0", changefreq: "weekly" },
    ...categoryIds.map((id) => ({ loc: `${origin}/kategori/${id}`, priority: "0.8", changefreq: "weekly" })),
    ...productIds.map((id) => ({ loc: `${origin}/urun/${id}`, priority: "0.6", changefreq: "monthly" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${escapeXml(entry.loc)}</loc><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
