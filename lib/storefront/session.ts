import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Tenant } from "@/lib/types";

import {
  decodeTierCookie,
  encodeTierCookie,
  getStorefrontAgeCookieName,
  getStorefrontTierCookieName,
  TIER_COOKIE_MAX_AGE_SECONDS,
  type StorefrontTierCookiePayload,
} from "@/lib/storefront/tier-cookie";

export { getStorefrontAgeCookieName, getStorefrontTierCookieName };

/** accessCodeId: şifreyle girildiyse access_codes.id; şifresiz giriş (auto/magnet) → yok. */
export type StorefrontPriceListCookieValue = StorefrontTierCookiePayload;

function getStorefrontTierCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: TIER_COOKIE_MAX_AGE_SECONDS,
  };
}

export async function readStorefrontPriceList(
  subdomain: string,
): Promise<StorefrontPriceListCookieValue | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(getStorefrontTierCookieName(subdomain))?.value;

  if (!value) {
    return null;
  }

  // İmza doğrulanır; düz JSON (eski biçim) ya da kurcalanmış çerez → null.
  return decodeTierCookie(value);
}

export async function clearStorefrontPriceList(subdomain: string) {
  const cookieStore = await cookies();
  cookieStore.delete(getStorefrontTierCookieName(subdomain));
}

export function isSecureStorefrontRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function setStorefrontPriceListCookie(params: {
  response: NextResponse;
  tenantId: string;
  subdomain: string;
  priceListId: string;
  isCatalogOnly: boolean;
  accessCodeId?: string;
  secure: boolean;
}) {
  params.response.cookies.set(
    getStorefrontTierCookieName(params.subdomain),
    encodeTierCookie({
      tenantId: params.tenantId,
      priceListId: params.priceListId,
      isCatalogOnly: params.isCatalogOnly,
      ...(params.accessCodeId ? { accessCodeId: params.accessCodeId } : {}),
    }),
    getStorefrontTierCookieOptions(params.secure),
  );
}

export function clearStorefrontPriceListCookie(params: {
  response: NextResponse;
  subdomain: string;
  secure: boolean;
}) {
  params.response.cookies.set(getStorefrontTierCookieName(params.subdomain), "", {
    ...getStorefrontTierCookieOptions(params.secure),
    maxAge: 0,
  });
}

function getStorefrontAgeCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function setStorefrontAgeVerifiedCookie(params: {
  response: NextResponse;
  subdomain: string;
  secure: boolean;
}) {
  params.response.cookies.set(
    getStorefrontAgeCookieName(params.subdomain),
    "1",
    getStorefrontAgeCookieOptions(params.secure),
  );
}

export function clearStorefrontAgeVerifiedCookie(params: {
  response: NextResponse;
  subdomain: string;
  secure: boolean;
}) {
  params.response.cookies.set(getStorefrontAgeCookieName(params.subdomain), "", {
    ...getStorefrontAgeCookieOptions(params.secure),
    maxAge: 0,
  });
}

export function isStorefrontPriceListStateValid(params: {
  cookieState: StorefrontPriceListCookieValue | null;
  tenant: Tenant;
}) {
  if (!params.cookieState) {
    return false;
  }

  return params.cookieState.tenantId === params.tenant.id;
}

/** @deprecated Use readStorefrontPriceList */
export async function readStorefrontTier(subdomain: string) {
  const state = await readStorefrontPriceList(subdomain);
  if (!state) {
    return null;
  }

  return state;
}

/** @deprecated Use clearStorefrontPriceList */
export async function clearStorefrontTier(subdomain: string) {
  await clearStorefrontPriceList(subdomain);
}

/** @deprecated Use setStorefrontPriceListCookie */
export function setStorefrontTierCookie(params: {
  response: NextResponse;
  tenantId: string;
  subdomain: string;
  tierLevel: never;
  secure: boolean;
}) {
  setStorefrontPriceListCookie({
    response: params.response,
    tenantId: params.tenantId,
    subdomain: params.subdomain,
    priceListId: "",
    isCatalogOnly: false,
    secure: params.secure,
  });
}

/** @deprecated Use clearStorefrontPriceListCookie */
export function clearStorefrontTierCookie(params: {
  response: NextResponse;
  subdomain: string;
  secure: boolean;
}) {
  clearStorefrontPriceListCookie(params);
}

/** @deprecated Use isStorefrontPriceListStateValid */
export function isStorefrontTierStateValid(params: {
  cookieState: Awaited<ReturnType<typeof readStorefrontPriceList>>;
  tenant: Tenant;
}) {
  return isStorefrontPriceListStateValid(params);
}
