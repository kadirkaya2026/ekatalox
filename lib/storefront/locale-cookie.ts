// Ayrı modül: tier-cookie.ts ile aynı desen, next/headers bağımlılığı yok.
export function getStorefrontLangCookieName(subdomain: string) {
  return `ekatalox-lang-${subdomain}`;
}
