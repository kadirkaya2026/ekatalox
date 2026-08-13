// Ayrı modül: proxy.ts da import ediyor; next/headers bağımlılığı olmamalı.
export function getStorefrontTierCookieName(subdomain: string) {
  return `ekatalox-tier-${subdomain}`;
}

// Yaş doğrulama onayı, fiyat listesi/şifre çerezinden bağımsız ayrı bir
// çerezde tutulur (proxy.ts iki gate'i de sırayla, sadece varlık kontrolüyle
// yönetir — bkz. proxy.ts).
export function getStorefrontAgeCookieName(subdomain: string) {
  return `ekatalox-age-${subdomain}`;
}
