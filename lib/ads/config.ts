import { z } from "zod";

// eKatalox'un KENDİ reklamları — yalnız Ücretsiz plandaki vitrinlerde
// (lib/billing/plans.ts planShowsStorefrontAds). Üçüncü taraf/Google reklamı
// yok. Tüm yerleşimler süper adminden (/admin/reklamlar) açılıp kapanır;
// ayar platform_settings tablosunda 'storefront_ads' anahtarında durur.
// Tablo yoksa ya da satır boşsa DEFAULT_STOREFRONT_ADS_CONFIG geçerlidir.

export const STOREFRONT_ADS_SETTINGS_KEY = "storefront_ads";

const shortText = z.string().trim().max(160);
const longText = z.string().trim().max(400);
const urlField = z.string().trim().url("Geçerli bir adres girin (https://…)").max(300);

export const storefrontAdsConfigSchema = z.object({
  /** Ana şalter: kapalıysa hiçbir yerleşim gösterilmez. */
  enabled: z.boolean(),
  /** Reklamların götürdüğü adres (ücretsiz kayıt sayfası). */
  cta_url: urlField,
  /** "Mağaza sahibi misiniz?" satırının götürdüğü adres (paketler). */
  owner_url: urlField,
  owner_text: shortText,
  bottom_bar: z.object({
    enabled: z.boolean(),
    text: shortText,
    cta_label: shortText,
  }),
  product_card: z.object({
    enabled: z.boolean(),
    /** Kaç üründe bir reklam kartı girsin. */
    every_n: z.number().int().min(4).max(60),
    title: shortText,
    text: longText,
    cta_label: shortText,
  }),
  popup: z.object({
    enabled: z.boolean(),
    /** Sayfa açıldıktan kaç saniye sonra. */
    delay_seconds: z.number().int().min(0).max(300),
    /** Aynı cihazda günde en fazla kaç kez (0 = hiç). */
    max_per_day: z.number().int().min(0).max(20),
    title: shortText,
    text: longText,
    cta_label: shortText,
  }),
  /** Sipariş PDF'i ve WhatsApp mesajının son satırı. */
  order_footer: z.object({
    enabled: z.boolean(),
    text: shortText,
  }),
  product_detail: z.object({
    enabled: z.boolean(),
    text: longText,
    cta_label: shortText,
  }),
  password_gate: z.object({
    enabled: z.boolean(),
    title: shortText,
    text: longText,
    cta_label: shortText,
  }),
});

export type StorefrontAdsConfig = z.infer<typeof storefrontAdsConfigSchema>;

export type StorefrontAdPlacement =
  | "bottom_bar"
  | "product_card"
  | "popup"
  | "order_footer"
  | "product_detail"
  | "password_gate";

export const DEFAULT_STOREFRONT_ADS_CONFIG: StorefrontAdsConfig = {
  enabled: true,
  cta_url: "https://ekatalox.com",
  owner_url: "https://ekatalox.com",
  owner_text: "Mağaza sahibi misiniz? Reklamları kaldırmak için bir paket seçin",
  bottom_bar: {
    enabled: true,
    text: "Bu katalog eKatalox ile yapıldı.",
    cta_label: "Sen de ücretsiz kur",
  },
  product_card: {
    enabled: true,
    every_n: 12,
    title: "Siz de kataloğunuzu ücretsiz yayınlayın",
    text: "Toptancılar için şifreli katalog, fiyat listeleri ve WhatsApp sipariş. 5 dakikada kurulur.",
    cta_label: "Ücretsiz başla",
  },
  popup: {
    enabled: true,
    delay_seconds: 20,
    max_per_day: 1,
    title: "Toptancı mısınız?",
    text: "Bu katalog eKatalox ile yapıldı. Siz de ürünlerinizi ücretsiz yükleyin, müşterileriniz WhatsApp'tan sipariş versin.",
    cta_label: "Ücretsiz kataloğumu kur",
  },
  order_footer: {
    enabled: true,
    text: "Bu sipariş eKatalox ile oluşturuldu. Siz de ücretsiz kurun: ekatalox.com",
  },
  product_detail: {
    enabled: true,
    text: "Bu katalog eKatalox ile yapıldı. Siz de ücretsiz kurun.",
    cta_label: "ekatalox.com",
  },
  password_gate: {
    enabled: true,
    title: "eKatalox Reklamları",
    text: "Bu katalog eKatalox ile yapıldı. Siz de kendi toptan kataloğunuzu ücretsiz yayınlayın.",
    cta_label: "Ücretsiz başla",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isRecord(patch) || !isRecord(base)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in out)) continue;
    const current = out[key];
    out[key] = isRecord(current) ? deepMerge(current, value) : value;
  }
  return out as T;
}

/** Kısmi/eski kayıtları varsayılanla tamamlar; geçersizse varsayılanı döner. */
export function normalizeStorefrontAdsConfig(raw: unknown): StorefrontAdsConfig {
  const merged = deepMerge(DEFAULT_STOREFRONT_ADS_CONFIG, raw);
  const parsed = storefrontAdsConfigSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_STOREFRONT_ADS_CONFIG;
}

/** Reklam linki: hangi vitrin ve hangi yerleşimden geldiği ölçülebilsin. */
export function buildStorefrontAdHref(
  baseUrl: string,
  placement: StorefrontAdPlacement,
  subdomain?: string | null,
): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", "vitrin");
    url.searchParams.set("utm_medium", "ekatalox_ads");
    url.searchParams.set("utm_campaign", placement);
    if (subdomain) url.searchParams.set("ref", subdomain);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
