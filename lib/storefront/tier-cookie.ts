// Ayrı modül: proxy.ts da import ediyor; next/headers bağımlılığı olmamalı.
import { createHmac, timingSafeEqual } from "node:crypto";

export function getStorefrontTierCookieName(subdomain: string) {
  return `ekatalox-tier-${subdomain}`;
}

// Yaş doğrulama onayı, fiyat listesi/şifre çerezinden bağımsız ayrı bir
// çerezde tutulur (proxy.ts iki gate'i de sırayla, sadece varlık kontrolüyle
// yönetir — bkz. proxy.ts).
export function getStorefrontAgeCookieName(subdomain: string) {
  return `ekatalox-age-${subdomain}`;
}

// Fiyat listesi çerezi İMZALI (8 Eki 2026 güvenlik taraması): eskiden düz JSON'du;
// ziyaretçi isCatalogOnly'yi false yapıp fiyatları açabiliyor, başka listenin
// id'sini yazabiliyor ya da kapıyı sahte çerezle geçebiliyordu. Biçim:
//   v1.<base64url(JSON)>.<base64url(HMAC-SHA256)>
// İmzasız/eski çerez geçersiz sayılır → ziyaretçi bir kez yeniden şifre girer.
export interface StorefrontTierCookiePayload {
  tenantId: string;
  priceListId: string;
  isCatalogOnly: boolean;
  accessCodeId?: string;
}

const TIER_COOKIE_VERSION = "v1";
export const TIER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function tierSigningKey() {
  const secret =
    process.env.STOREFRONT_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHmac("sha256", "ekatalox-tier-cookie").update(secret).digest();
}

function sign(data: string) {
  return createHmac("sha256", tierSigningKey()).update(data).digest("base64url");
}

export function encodeTierCookie(payload: StorefrontTierCookiePayload): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TIER_COOKIE_MAX_AGE_SECONDS,
    }),
  ).toString("base64url");
  const data = `${TIER_COOKIE_VERSION}.${body}`;
  return `${data}.${sign(data)}`;
}

export function decodeTierCookie(value: string | undefined | null): StorefrontTierCookiePayload | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== TIER_COOKIE_VERSION) return null;

  const data = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Partial<
      StorefrontTierCookiePayload & { exp: number }
    >;
    if (
      typeof parsed.tenantId !== "string" ||
      typeof parsed.priceListId !== "string" ||
      typeof parsed.isCatalogOnly !== "boolean" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Date.now() / 1000
    ) {
      return null;
    }
    return {
      tenantId: parsed.tenantId,
      priceListId: parsed.priceListId,
      isCatalogOnly: parsed.isCatalogOnly,
      ...(typeof parsed.accessCodeId === "string" && parsed.accessCodeId
        ? { accessCodeId: parsed.accessCodeId }
        : {}),
    };
  } catch {
    return null;
  }
}
