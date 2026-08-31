import { NextResponse } from "next/server";
import { getStorefrontTenant, resolveDefaultPriceListForTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStorefrontMagnetCookieName,
  MAGNET_COOKIE_MAX_AGE,
} from "@/lib/storefront/magnet-cookie";
import {
  isSecureStorefrontRequest,
  setStorefrontPriceListCookie,
} from "@/lib/storefront/session";

// Magnetle şifresiz giriş (bkz. tenants.magnet_login_enabled, 0104).
//
// Proxy geçerli FORMATLI bir magnet koduyla gelen ziyaretçiyi buraya
// yönlendirir; kod burada DB'den doğrulanır (bu tenant'ın kodu mu, pasif mi).
// Geçerliyse şifre kapısının kurduğu fiyat listesi çerezi kurulur ve müşteri
// şifre görmeden vitrine döner. Geçersizse magnet çerezi TEMİZLENİR — yoksa
// proxy'nin "magnet çerezi var, magnet-enter'a gönder" dalıyla sonsuz döngü
// oluşurdu; çerez silinince ziyaretçi normal şifre kapısına düşer.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain")?.trim().toLowerCase() ?? "";
  const rawCode = url.searchParams.get("code")?.trim().toLowerCase().replace(/[\s-]/g, "") ?? "";
  const redirectToParam = url.searchParams.get("redirectTo") ?? "/";
  const redirectTo = redirectToParam.startsWith("/") ? redirectToParam : "/";
  const secure = isSecureStorefrontRequest(request);

  const response = NextResponse.redirect(new URL(redirectTo, url.origin));
  response.headers.set("Cache-Control", "no-store, max-age=0");

  if (!subdomain || !/^[a-z0-9]{4,16}$/.test(rawCode)) {
    return response;
  }

  const cookieBase = {
    name: getStorefrontMagnetCookieName(subdomain),
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
  };

  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant || tenant.status !== "active") {
    return response;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return response;
  }

  const { data: magnet } = await supabase
    .from("magnet_codes")
    .select("id, is_disabled")
    .eq("tenant_id", tenant.id)
    .ilike("code", rawCode)
    .maybeSingle();

  if (!magnet || magnet.is_disabled) {
    // Geçersiz/pasif kod şifresiz giriş hakkı vermez; çerez de silinir ki
    // ziyaretçi şifre kapısına düşebilsin (döngü kırılır).
    response.cookies.set({ ...cookieBase, value: "", maxAge: 0 });
    return response;
  }

  // Magnet çerezi (sipariş → magnet eşleşmesi için) her durumda tazelenir.
  response.cookies.set({ ...cookieBase, value: rawCode, maxAge: MAGNET_COOKIE_MAX_AGE });

  if (!tenant.is_password_protected || !tenant.magnet_login_enabled) {
    return response;
  }

  // Magnet ziyaretçisinin listesi: önce bayinin magnet'e özel seçimi
  // (magnet_price_list_id), yoksa şifresiz ziyaretçi listesi
  // (public_price_list_id), o da yoksa ilk fiyatlı liste. Seçilen liste
  // silinmişse resolveDefault... geçersiz id'yi eleyip fallback'e düşer.
  const priceList = await resolveDefaultPriceListForTenant(
    tenant.id,
    tenant.magnet_price_list_id ?? tenant.public_price_list_id,
  );

  if (!priceList) {
    return response;
  }

  setStorefrontPriceListCookie({
    response,
    tenantId: tenant.id,
    subdomain,
    priceListId: priceList.priceListId,
    isCatalogOnly: priceList.isCatalogOnly,
    secure,
  });

  return response;
}
