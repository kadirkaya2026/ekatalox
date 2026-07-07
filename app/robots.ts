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
  // her host için tarayıcılara tamamen kapalıyız.
  if (kind !== "marketing") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
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
