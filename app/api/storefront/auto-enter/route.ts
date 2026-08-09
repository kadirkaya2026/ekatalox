import { NextResponse } from "next/server";
import { getStorefrontTenant, resolveDefaultPriceListForTenant } from "@/lib/data";
import {
  isSecureStorefrontRequest,
  setStorefrontPriceListCookie,
} from "@/lib/storefront/session";

// Tenant admin "Şifre kullanma" ayarını açtığında (bkz. tenants.is_password_protected)
// gate'e düşen ziyaretçi buraya yönlendirilir: kod girmeden, tenant'ın ilk fiyat
// listesiyle oturum çerezi kurulup istenen sayfaya geri gönderilir.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain")?.trim().toLowerCase() ?? "";
  const redirectToParam = url.searchParams.get("redirectTo") ?? "/";
  const redirectTo = redirectToParam.startsWith("/") ? redirectToParam : "/";

  const tenant = subdomain ? await getStorefrontTenant(subdomain) : null;

  if (!tenant || tenant.status !== "active" || tenant.is_password_protected) {
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  }

  const priceList = await resolveDefaultPriceListForTenant(tenant.id, tenant.public_price_list_id);

  if (!priceList) {
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  }

  const response = NextResponse.redirect(new URL(redirectTo, url.origin));
  setStorefrontPriceListCookie({
    response,
    tenantId: tenant.id,
    subdomain,
    priceListId: priceList.priceListId,
    isCatalogOnly: priceList.isCatalogOnly,
    secure: isSecureStorefrontRequest(request),
  });

  return response;
}
