import { getKurumsalPageContext } from "@/lib/kurumsal/page-context";

// Kurumsal sitenin robots'u: alan adı modunda /robots.txt, platform
// adresinde /kurumsal/robots.txt (proxy.ts bu yola yeniden yazar). Yayında ve
// paket kapsıyorsa açık + sitemap; değilse kapalı.
export async function GET(_request: Request, ctx: RouteContext<"/store/[subdomain]/kurumsal/robots">) {
  const { subdomain } = await ctx.params;
  const page = await getKurumsalPageContext(subdomain);
  const body = page
    ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${page.kurumsalOrigin}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
