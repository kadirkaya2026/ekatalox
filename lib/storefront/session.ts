import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { PriceTierLevel, Tenant } from "@/lib/types";

export function getStorefrontTierCookieName(subdomain: string) {
  return `ekatalox-tier-${subdomain}`;
}

interface StorefrontTierCookieValue {
  tenantId: string;
  tierLevel: PriceTierLevel;
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

export async function readStorefrontTier(subdomain: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(getStorefrontTierCookieName(subdomain))?.value;

  if (value === "1" || value === "2" || value === "3") {
    return {
      tenantId: "",
      tierLevel: Number(value) as PriceTierLevel,
    };
  }

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StorefrontTierCookieValue>;

    if (
      typeof parsed.tenantId === "string" &&
      (parsed.tierLevel === 1 || parsed.tierLevel === 2 || parsed.tierLevel === 3)
    ) {
      return {
        tenantId: parsed.tenantId,
        tierLevel: parsed.tierLevel,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function writeStorefrontTier(
  subdomain: string,
  tierLevel: PriceTierLevel,
) {
  const cookieStore = await cookies();
  cookieStore.set(
    getStorefrontTierCookieName(subdomain),
    String(tierLevel),
    getStorefrontTierCookieOptions(process.env.NODE_ENV === "production"),
  );
}

export async function clearStorefrontTier(subdomain: string) {
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

export function setStorefrontTierCookie(params: {
  response: NextResponse;
  tenantId: string;
  subdomain: string;
  tierLevel: PriceTierLevel;
  secure: boolean;
}) {
  params.response.cookies.set(
    getStorefrontTierCookieName(params.subdomain),
    JSON.stringify({
      tenantId: params.tenantId,
      tierLevel: params.tierLevel,
    } satisfies StorefrontTierCookieValue),
    getStorefrontTierCookieOptions(params.secure),
  );
}

export function clearStorefrontTierCookie(params: {
  response: NextResponse;
  subdomain: string;
  secure: boolean;
}) {
  params.response.cookies.set(getStorefrontTierCookieName(params.subdomain), "", {
    ...getStorefrontTierCookieOptions(params.secure),
    maxAge: 0,
  });
}

export function isStorefrontTierStateValid(params: {
  cookieState: Awaited<ReturnType<typeof readStorefrontTier>>;
  tenant: Tenant;
}) {
  if (!params.cookieState) {
    return false;
  }

  if (!params.cookieState.tenantId) {
    return true;
  }

  return params.cookieState.tenantId === params.tenant.id;
}