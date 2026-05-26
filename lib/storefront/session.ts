import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { PriceTierLevel } from "@/lib/types";

export function getStorefrontTierCookieName(subdomain: string) {
  return `ekatalox-tier-${subdomain}`;
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
    return Number(value) as PriceTierLevel;
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
  subdomain: string;
  tierLevel: PriceTierLevel;
  secure: boolean;
}) {
  params.response.cookies.set(
    getStorefrontTierCookieName(params.subdomain),
    String(params.tierLevel),
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