export const RESERVED_SUBDOMAINS = [
  "admin",
  "app",
  "www",
  "api",
  "ekatalox",
  "assets",
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