import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveHost } from "@/lib/tenancy/resolve-host";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  const { kind } = resolveHost(host);

  // Yalnızca pazarlama sitesi indexlenebilir. Tenant vitrinleri, özel alan
  // adları (kind: "unknown" döner), admin ve app panelleri dahil geri kalan
  // her host için tarayıcılara tamamen kapalıyız — TEK istisna kurumsal site:
  // katalog adresindeki /kurumsal (bilerek herkese açık, fiyatsız tanıtım
  // sayfası; yayında olmayan tenant'ta 404 döner, zararsız). Kendi alan
  // adındaki kurumsal siteyi proxy.ts ayrı bir robots ile karşılar.
  if (kind !== "marketing") {
    return {
      rules: {
        userAgent: "*",
        allow: ["/kurumsal", "/kurumsal/"],
        disallow: "/",
      },
      sitemap: `https://${host.replace(/:\d+$/, "")}/kurumsal/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/store/", "/dashboard", "/admin", "/login", "/api/"],
    },
    sitemap: "https://www.ekatalox.com/sitemap.xml",
  };
}
