// Perakende/ev yapımı mağaza ayarları (0155). tenant_storefront_settings.retail_config:
// {
//   info_sections: [{ emoji, title, body }],               // anasayfa altındaki bilgi kartları
//   delivery_date: { enabled, min_days, long_min_days, long_category_ids },
//   menu_builder:  { enabled, pick_count, min_people, lead_days, exclude_category_ids,
//                    title, intro, price_note }
// }
// Boş/geçersiz alan = özellik kapalı.

export interface RetailInfoSection {
  emoji: string;
  title: string;
  body: string;
  /** Ayrı sayfa adresi: /bilgi/<slug> (verilmezse başlıktan üretilir). */
  slug: string;
  /** Sayfadaki görsel (isteğe bağlı). */
  imageUrl: string | null;
}

export interface RetailDeliveryDate {
  minDays: number;
  longMinDays: number;
  longCategoryIds: string[];
}

export interface RetailMenuBuilder {
  pickCount: number;
  minPeople: number;
  leadDays: number;
  excludeCategoryIds: string[];
  title: string;
  intro: string;
  priceNote: string;
}

export interface RetailConfig {
  infoSections: RetailInfoSection[];
  /** true: bölümler anasayfada kart değil, ayrı sayfa olur ve footer'dan bağlanır. */
  infoAsPages: boolean;
  deliveryDate: RetailDeliveryDate | null;
  menuBuilder: RetailMenuBuilder | null;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const int = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const ids = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);

export function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveRetailConfig(raw: unknown): RetailConfig {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sections = Array.isArray(value.info_sections) ? value.info_sections : [];
  const dd = value.delivery_date && typeof value.delivery_date === "object" ? (value.delivery_date as Record<string, unknown>) : null;
  const mb = value.menu_builder && typeof value.menu_builder === "object" ? (value.menu_builder as Record<string, unknown>) : null;
  const minDays = dd ? int(dd.min_days, 2, 0, 60) : 0;
  return {
    infoSections: sections
      .map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : {}))
      .map((s) => ({
        emoji: str(s.emoji),
        title: str(s.title),
        body: str(s.body),
        slug: slugify(str(s.slug) || str(s.title)),
        imageUrl: str(s.image_url) || null,
      }))
      .filter((s) => s.title && s.body && s.slug),
    infoAsPages: value.info_display === "pages",
    deliveryDate:
      dd && dd.enabled
        ? { minDays, longMinDays: int(dd.long_min_days, minDays, minDays, 60), longCategoryIds: ids(dd.long_category_ids) }
        : null,
    menuBuilder:
      mb && mb.enabled
        ? {
            pickCount: int(mb.pick_count, 6, 1, 20),
            minPeople: int(mb.min_people, 10, 1, 10000),
            leadDays: int(mb.lead_days, 3, 0, 60),
            excludeCategoryIds: ids(mb.exclude_category_ids),
            title: str(mb.title) || "Menünüzü Oluşturun",
            intro: str(mb.intro),
            priceNote: str(mb.price_note),
          }
        : null,
  };
}

/** İstanbul takvim gününe göre bugün + gün (yyyy-mm-dd). */
export function istanbulDatePlus(days: number, from: Date = new Date()): string {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(from);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10-12" → "12 Ekim 2026 Pazar" */
export function formatDeliveryDate(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return ymd;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "UTC" }).format(d);
}

/** Sepetteki ürünlere göre en erken teslim günü (yyyy-mm-dd). */
export function earliestDeliveryDate(config: RetailDeliveryDate, cartCategoryIds: string[]): string {
  const long = cartCategoryIds.some((id) => config.longCategoryIds.includes(id));
  return istanbulDatePlus(long ? config.longMinDays : config.minDays);
}
