import { buildKurumsalLlmsTxt } from "@/lib/kurumsal/ai-discovery";
import { getKurumsalPageContext } from "@/lib/kurumsal/page-context";
import { getKurumsalDataCached } from "@/lib/storefront/kurumsal-data";

// Kurumsal sitenin llms.txt'si: alan adı modunda /llms.txt, platform
// adresinde /kurumsal/llms.txt (proxy.ts bu yola yeniden yazar). Yayında
// değilse / paket yoksa 404 (getKurumsalPageContext).
export async function GET(_request: Request, ctx: RouteContext<"/store/[subdomain]/kurumsal/llms">) {
  const { subdomain } = await ctx.params;
  const page = await getKurumsalPageContext(subdomain);
  if (!page) return new Response("Not Found", { status: 404 });

  const data = await getKurumsalDataCached(page.tenant.id);
  return new Response(buildKurumsalLlmsTxt(page, data), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
