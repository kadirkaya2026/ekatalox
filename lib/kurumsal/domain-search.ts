// "Yeni alan adı seç": alan adı müsaitlik araması için saf yardımcılar
// (Vercel'e gitmez; veri çekmez). Rota app/api/tenant/kurumsal/domain/search
// bunları kullanır; Vercel çağrısı lib/vercel/domains.ts'te.
//
// Kural: doğrulayamadığımız müsaitliği ASLA "boşta" diye göstermeyiz.
// Vercel'in desteklemediği uzantılarda (ör. .com.tr) available: null döner.

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Uzantısız aramada denenen uzantılar (sırayla gösterilir). */
export const SEARCH_TLDS = ["com", "com.tr", "net", "org", "co"] as const;

export const UNCHECKABLE_NOTE = "Bu uzantı için müsaitlik kontrolü yapılamıyor";

export interface DomainSearchResult {
  domain: string;
  /** true boşta, false dolu, null kontrol edilemedi */
  available: boolean | null;
  price?: number;
  currency: "USD";
  /** Fiyatın kapsadığı yıl (genelde 1) */
  period?: number;
  premium?: boolean;
  note?: string;
}

/** Kullanıcı girdisini temizler: küçük harf, şema/yol/www/boşluk yok. */
export function normalizeSearchInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(/[/?#]/)[0]
    .replace(/^www\./, "")
    .replace(/\s+/g, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "")
    .replace(/^\.+/, "");
}

/** Türkçe karakterleri ASCII'ye çevirir (alan adında yalnız a-z 0-9 - geçer). */
export function asciiFoldTr(value: string): string {
  return value
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9.-]/g, "");
}

/**
 * Girdiyi aranacak alan adlarına açar. Uzantı yazıldıysa yalnız o; yalnız
 * ad yazıldıysa SEARCH_TLDS ile birleştirilir. Hata mesajı → geçersiz girdi.
 */
export function buildSearchCandidates(raw: string): { ok: true; domains: string[] } | { ok: false; error: string } {
  const normalized = asciiFoldTr(normalizeSearchInput(raw));
  if (!normalized) return { ok: false, error: "Aramak istediğiniz alan adını yazın. Örn: firmaniz veya firmaniz.com" };

  if (!normalized.includes(".")) {
    if (!LABEL_RE.test(normalized)) {
      return { ok: false, error: "Alan adında yalnız harf, rakam ve tire kullanılabilir; tire başta/sonda olamaz." };
    }
    return { ok: true, domains: SEARCH_TLDS.map((tld) => `${normalized}.${tld}`) };
  }

  if (!HOSTNAME_RE.test(normalized)) {
    return { ok: false, error: "Geçerli bir alan adı girin. Örn: firmaniz.com" };
  }
  return { ok: true, domains: [normalized] };
}

/** Alan adının uzantısı (en uzun eşleşen çok parçalı uzantı; ör. "com.tr"). */
export function getTld(domain: string, knownTlds: ReadonlySet<string>): string {
  const parts = domain.split(".");
  for (let take = Math.min(3, parts.length - 1); take >= 1; take -= 1) {
    const candidate = parts.slice(-take).join(".");
    if (knownTlds.has(candidate)) return candidate;
  }
  return parts.slice(1).join(".");
}

/** Uzantı Vercel'de sorgulanabilir mi? Liste yoksa (null) sorulur. */
export function isCheckableTld(domain: string, supportedTlds: ReadonlySet<string> | null): boolean {
  if (!supportedTlds) return true;
  return supportedTlds.has(getTld(domain, supportedTlds));
}

export interface VercelSearchRow {
  domain: string;
  available: boolean;
  years?: number;
  price?: number;
  renewalPrice?: number;
  premium?: boolean;
}

/**
 * Vercel yanıtını (POST /v1/registrar/domains/search) sonuç listesine çevirir.
 * Vercel'de `available:false` "dolu YA DA doğrulanamadı" demek; desteklenen
 * uzantıda bunu "dolu" sayıyoruz, desteklenmeyen uzantıyı hiç sormayıp null
 * bırakıyoruz. supportedTlds null ise (liste alınamadı) hepsi sorulur.
 */
export function mapSearchResults(
  domains: string[],
  rows: VercelSearchRow[] | null,
  supportedTlds: ReadonlySet<string> | null,
): DomainSearchResult[] {
  const byDomain = new Map((rows ?? []).map((row) => [row.domain.toLowerCase(), row]));
  return domains.map((domain) => {
    if (!isCheckableTld(domain, supportedTlds)) {
      return { domain, available: null, currency: "USD", note: UNCHECKABLE_NOTE };
    }
    const row = byDomain.get(domain);
    if (!row) return { domain, available: null, currency: "USD", note: UNCHECKABLE_NOTE };
    if (!row.available) return { domain, available: false, currency: "USD" };
    return {
      domain,
      available: true,
      currency: "USD",
      price: typeof row.price === "number" ? row.price : undefined,
      period: typeof row.years === "number" ? row.years : 1,
      premium: Boolean(row.premium),
    };
  });
}

/** Vercel'e hiç ulaşılamayınca (env yok / hata) tüm adaylar "kontrol edilemiyor". */
export function uncheckableResults(domains: string[], note = UNCHECKABLE_NOTE): DomainSearchResult[] {
  return domains.map((domain) => ({ domain, available: null, currency: "USD", note }));
}

export function formatUsd(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}
