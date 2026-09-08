export const RESERVED_SUBDOMAINS = [
  "admin",
  "app",
  "www",
  "api",
  "ekatalox",
  "assets",
  // Self-servis kayıt (8 Eyl 2026): esnafın kendi seçtiği alt alan adı
  // sistem/altyapı adlarıyla çakışmasın.
  "mail",
  "blog",
  "store",
  "demo",
  "support",
  "help",
  "test",
  "staging",
  "dev",
  "panel",
  "admin2",
  "api2",
  "cdn",
  "static",
  "assets2",
  "login",
  "kayit",
  "basvuru",
  "app2",
  "docs",
  "status",
  "m",
  "shop",
] as const;

export const RESERVED_SUBDOMAIN_MESSAGE =
  "Bu alt alan adı sistem tarafından rezerve edilmiştir.";

export function normalizeSubdomain(value: string) {
  return value.trim().toLowerCase();
}

export function isReservedSubdomain(value: string) {
  return RESERVED_SUBDOMAINS.includes(
    normalizeSubdomain(value) as (typeof RESERVED_SUBDOMAINS)[number],
  );
}

export const SUBDOMAIN_MIN_LENGTH = 3;
export const SUBDOMAIN_MAX_LENGTH = 40;

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i̇: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  I: "i",
  İ: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

/**
 * Serbest metni alt alan adına çevirir: Türkçe karakterler ASCII'ye,
 * küçük harf, yalnız [a-z0-9-], baştaki/sondaki ve ardışık tireler düşer.
 * Uzunluk kontrolü yapmaz (bkz. isValidSubdomainFormat).
 */
export function slugifySubdomain(value: string) {
  const mapped = Array.from(value.trim())
    .map((ch) => TURKISH_CHAR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return mapped
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSubdomainFormat(value: string) {
  return (
    value.length >= SUBDOMAIN_MIN_LENGTH &&
    value.length <= SUBDOMAIN_MAX_LENGTH &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)
  );
}
