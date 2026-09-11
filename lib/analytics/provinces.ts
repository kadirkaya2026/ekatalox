// Türkiye il listesi (plaka kodu → ad) ve istek başlıklarından il çözümleme.
//
// Coğrafi başlıklar (ISO 3166-2 alt bölüm kodu Türkiye'de plaka koduyla
// aynıdır: "34" = İstanbul):
//   Cloudflare: cf-ipcountry, cf-region-code, cf-ipcity  (tercih edilen)
//   Vercel:     x-vercel-ip-country, x-vercel-ip-country-region, x-vercel-ip-city
// Saklanan değer: TR için iki haneli plaka kodu, yurt dışı için "XX:<ülke>".

export const TR_PROVINCES: Record<string, string> = {
  "01": "Adana", "02": "Adıyaman", "03": "Afyonkarahisar", "04": "Ağrı", "05": "Amasya",
  "06": "Ankara", "07": "Antalya", "08": "Artvin", "09": "Aydın", "10": "Balıkesir",
  "11": "Bilecik", "12": "Bingöl", "13": "Bitlis", "14": "Bolu", "15": "Burdur",
  "16": "Bursa", "17": "Çanakkale", "18": "Çankırı", "19": "Çorum", "20": "Denizli",
  "21": "Diyarbakır", "22": "Edirne", "23": "Elazığ", "24": "Erzincan", "25": "Erzurum",
  "26": "Eskişehir", "27": "Gaziantep", "28": "Giresun", "29": "Gümüşhane", "30": "Hakkari",
  "31": "Hatay", "32": "Isparta", "33": "Mersin", "34": "İstanbul", "35": "İzmir",
  "36": "Kars", "37": "Kastamonu", "38": "Kayseri", "39": "Kırklareli", "40": "Kırşehir",
  "41": "Kocaeli", "42": "Konya", "43": "Kütahya", "44": "Malatya", "45": "Manisa",
  "46": "Kahramanmaraş", "47": "Mardin", "48": "Muğla", "49": "Muş", "50": "Nevşehir",
  "51": "Niğde", "52": "Ordu", "53": "Rize", "54": "Sakarya", "55": "Samsun",
  "56": "Siirt", "57": "Sinop", "58": "Sivas", "59": "Tekirdağ", "60": "Tokat",
  "61": "Trabzon", "62": "Tunceli", "63": "Şanlıurfa", "64": "Uşak", "65": "Van",
  "66": "Yozgat", "67": "Zonguldak", "68": "Aksaray", "69": "Bayburt", "70": "Karaman",
  "71": "Kırıkkale", "72": "Batman", "73": "Şırnak", "74": "Bartın", "75": "Ardahan",
  "76": "Iğdır", "77": "Yalova", "78": "Karabük", "79": "Kilis", "80": "Osmaniye",
  "81": "Düzce",
};

export const FOREIGN_PREFIX = "XX:";
export const UNKNOWN_PROVINCE_LABEL = "Bilinmiyor";

// Şehir adından il tahmini için takma adlar (MaxMind eski/alternatif adlar).
const CITY_ALIASES: Record<string, string> = {
  afyon: "03",
  icel: "33",
  maras: "46",
  kahramanmaras: "46",
  urfa: "63",
  sanliurfa: "63",
  antep: "27",
  gaziantep: "27",
  istanbul: "34",
  izmir: "35",
  izmit: "41",
  antakya: "31",
  iskenderun: "31",
  adapazari: "54",
};

export function normalizeTurkishName(value: string) {
  return value
    .trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

const PROVINCE_BY_NORMALIZED_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(TR_PROVINCES).map(([code, name]) => [normalizeTurkishName(name), code]),
);

function decodeHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

/** Şehir adından plaka kodu (bilinmiyorsa null). */
export function provinceCodeFromCityName(city: string | null | undefined) {
  if (!city) return null;
  const key = normalizeTurkishName(city);
  if (!key) return null;
  return PROVINCE_BY_NORMALIZED_NAME[key] ?? CITY_ALIASES[key] ?? null;
}

function provinceCodeFromRegion(region: string | null) {
  if (!region) return null;
  const digits = region.replace(/^TR-?/i, "").trim();
  const padded = /^\d{1,2}$/.test(digits) ? digits.padStart(2, "0") : null;
  return padded && TR_PROVINCES[padded] ? padded : null;
}

function codeForCountry(
  country: string,
  region: string | null,
  city: string | null,
): string | null {
  if (country !== "TR") {
    return /^[A-Z]{2}$/.test(country) ? `${FOREIGN_PREFIX}${country}` : null;
  }
  return provinceCodeFromRegion(region) ?? provinceCodeFromCityName(city);
}

/**
 * İstek başlıklarından saklanacak il kodunu üretir.
 * TR → "34" gibi plaka kodu; yurt dışı → "XX:DE"; tespit yoksa null.
 *
 * SIRA ÖNEMLİ: ekatalox.com Cloudflare arkasında. Vercel'in x-vercel-ip-*
 * başlıkları bağlanan IP'ye (Cloudflare kenar sunucusu, ör. Amsterdam) göre
 * hesaplanır; gerçek müşteri konumu değildir. Cloudflare proxy'lediği
 * isteklerde cf-connecting-ip taşır; o varsa YALNIZ Cloudflare başlıkları
 * kullanılır: cf-ipcountry (her zaman), cf-region-code / cf-ipcity (panelde
 * "Add visitor location headers" managed transform açıksa). Cloudflare yoksa
 * Vercel başlıklarına düşülür.
 */
export function resolveProvinceCodeFromHeaders(headers: Headers): string | null {
  const behindCloudflare = Boolean(headers.get("cf-connecting-ip"));

  const cfCountry = decodeHeader(headers.get("cf-ipcountry"))?.toUpperCase() ?? null;
  if (behindCloudflare || cfCountry) {
    if (!cfCountry || cfCountry === "XX" || cfCountry === "T1") return null;
    return codeForCountry(
      cfCountry,
      decodeHeader(headers.get("cf-region-code")),
      decodeHeader(headers.get("cf-ipcity")),
    );
  }

  const country = decodeHeader(headers.get("x-vercel-ip-country"))?.toUpperCase() ?? null;
  if (!country) return null;
  return codeForCountry(
    country,
    decodeHeader(headers.get("x-vercel-ip-country-region")),
    decodeHeader(headers.get("x-vercel-ip-city")),
  );
}

const countryNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["tr"], { type: "region" })
    : null;

/** Saklanan kodu kullanıcıya gösterilecek ada çevirir. */
export function provinceLabel(code: string | null | undefined) {
  if (!code) return UNKNOWN_PROVINCE_LABEL;

  if (TR_PROVINCES[code]) return TR_PROVINCES[code];

  if (code.startsWith(FOREIGN_PREFIX)) {
    const country = code.slice(FOREIGN_PREFIX.length);
    let name: string | undefined;
    try {
      name = countryNames?.of(country) ?? undefined;
    } catch {
      name = undefined;
    }
    return `Yurt dışı (${name ?? country})`;
  }

  return UNKNOWN_PROVINCE_LABEL;
}

export function isForeignCode(code: string) {
  return code.startsWith(FOREIGN_PREFIX);
}
