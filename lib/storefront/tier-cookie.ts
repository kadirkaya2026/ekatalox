// Ayrı modül: proxy.ts da import ediyor; next/headers bağımlılığı olmamalı.
export function getStorefrontTierCookieName(subdomain: string) {
  return `ekatalox-tier-${subdomain}`;
}
