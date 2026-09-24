import { NextResponse } from "next/server";
import { validateAccessCode } from "@/lib/data";
import { SITE } from "@/lib/marketing/site";
import {
  isSecureStorefrontRequest,
  setStorefrontPriceListCookie,
} from "@/lib/storefront/session";

// Pazarlama sitesindeki "Demo kataloğu aç" düğmeleri buraya gelir (24 Eyl 2026):
// ziyaretçi şifre ekranını görmeden demo kataloğa bayi olarak girer. YALNIZ
// SITE.demoUrl'deki demo mağaza için çalışır; şifre zaten sitede herkese açık
// yazılı olan demo şifresidir (SITE.demoPassword). Başka tenant'a şifresiz
// giriş vermez — alt alan adı istekten değil sabitten okunur.
const DEMO_SUBDOMAIN = new URL(SITE.demoUrl).hostname.split(".")[0];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url.origin));
  response.headers.set("Cache-Control", "no-store, max-age=0");

  // Yalnız demo mağazanın kendi alan adından gelen istek (çerez o alan adına kurulur).
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host).toLowerCase();
  if (host.split(".")[0] !== DEMO_SUBDOMAIN) {
    return response;
  }

  const matched = await validateAccessCode({ subdomain: DEMO_SUBDOMAIN, code: SITE.demoPassword });

  if (!matched) {
    // Demo şifresi değiştiyse normal şifre ekranına düşer.
    return response;
  }

  setStorefrontPriceListCookie({
    response,
    tenantId: matched.tenant.id,
    subdomain: DEMO_SUBDOMAIN,
    priceListId: matched.priceListId,
    isCatalogOnly: matched.isCatalogOnly,
    accessCodeId: matched.accessCodeId,
    secure: isSecureStorefrontRequest(request),
  });

  return response;
}
