// Ayrı modül: proxy.ts da import ediyor; next/headers bağımlılığı olmamalı
// (tier-cookie.ts ile aynı gerekçe).
//
// Magnet çerezi vitrin HOST'unda yaşar: /t/{kod} pazarlama alanında çalışır,
// kodu ?m= parametresiyle vitrine taşır, proxy.ts orada bu çereze çevirir.
// Çerez HttpOnly'dir — istemci JS'in koda ihtiyacı yok, kod yalnızca
// generate-pdf route'unda okunur.

export function getStorefrontMagnetCookieName(subdomain: string) {
  return `ekatalox-magnet-${subdomain}`;
}

/** ?m= parametresinin adı. Kısa: adres çubuğunda bir anlığına görünüyor. */
export const MAGNET_QUERY_PARAM = "m";

// "Cihazda kalıcı" kararı: 10 yıl. Magnet buzdolabında yıllarca duruyor;
// çerez ondan önce ölmemeli. Yeni magnet okutulursa proxy üzerine yazar
// (son okutulan kazanır).
export const MAGNET_COOKIE_MAX_AGE = 10 * 365 * 24 * 60 * 60;
