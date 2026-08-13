import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Tenant } from "@/lib/types";

import {
  getStorefrontAgeCookieName,
  getStorefrontTierCookieName,
} from "@/lib/storefront/tier-cookie";

export { getStorefrontAgeCookieName, getStorefrontTierCookieName };

export interface StorefrontPriceListCookieValue {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
}

function getStorefrontTierCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

function parseLegacyTierLevel(value: string): StorefrontPriceListCookieValue | null {
  if (value !== "1" && value !== "2" && value !== "3") {
    return null;
  }

  return {
    tenantId: "",
    priceListId: "",
    isCatalogOnly: false,
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

  const legacy = parseLegacyTierLevel(value);
  if (legacy) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StorefrontPriceListCookieValue>;

    if (
      typeof parsed.tenantId === "string" &&
      typeof parsed.priceListId === "string" &&
      typeof parsed.isCatalogOnly === "boolean"
    ) {
      return {
        tenantId: parsed.tenantId,
        priceListId: parsed.priceListId,
        isCatalogOnly: parsed.isCatalogOnly,
      };
    }
  } catch {
    return null;
  }

  return null;
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
  secure: boolean;
}) {
  params.response.cookies.set(
    getStorefrontTierCookieName(params.subdomain),
    JSON.stringify({
      tenantId: params.tenantId,
      priceListId: params.priceListId,
      isCatalogOnly: params.isCatalogOnly,
    } satisfies StorefrontPriceListCookieValue),
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
