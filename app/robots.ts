import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveHost } from "@/lib/tenancy/resolve-host";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  const { kind } = resolveHost(host);

  if (kind === "storefront") {
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
    },
  };
}
