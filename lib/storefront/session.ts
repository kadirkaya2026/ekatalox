import { cookies } from "next/headers";
import type { PriceTierLevel } from "@/lib/types";

export function getStorefrontTierCookieName(subdomain: string) {
  return `ekatalox-tier-${subdomain}`;
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
  cookieStore.set(getStorefrontTierCookieName(subdomain), String(tierLevel), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearStorefrontTier(subdomain: string) {
  const cookieStore = await cookies();
  cookieStore.delete(getStorefrontTierCookieName(subdomain));
}