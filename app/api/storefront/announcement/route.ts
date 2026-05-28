export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getStorefrontTenant,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { resolveHost } from "@/lib/tenancy/resolve-host";

function resolveRequestSubdomain(request: Request) {
  const url = new URL(request.url);
  const explicitSubdomain = url.searchParams.get("subdomain")?.trim().toLowerCase();

  if (explicitSubdomain) {
    return explicitSubdomain;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  return resolveHost(host).subdomain;
}

export async function GET(request: Request) {
  const subdomain = resolveRequestSubdomain(request);

  if (!subdomain) {
    return NextResponse.json(
      { error: "Storefront subdomain bilgisi zorunludur." },
      { status: 400 },
    );
  }

  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  }

  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);

  return NextResponse.json({
    announcement_title: storefrontSettings.announcement_title,
    announcement_body: storefrontSettings.announcement_body,
    is_active: storefrontSettings.is_active,
    version: storefrontSettings.version,
    max_display_count: storefrontSettings.max_display_count,
  });
}