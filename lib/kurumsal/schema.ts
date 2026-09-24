import { z } from "zod";
import type { Tenant, TenantStorefrontSettings } from "@/lib/types";
import {
  DEFAULT_CUSTOMER_TYPE,
  getKurumsalPreset,
  pickDefaultHighlights,
  renderTemplate,
  resolveSectorKey,
} from "@/lib/kurumsal/presets";

// Kurumsal site (/kurumsal) içerik şeması. tenant_kurumsal_sites.content
// jsonb kolonunun TEK doğruluk kaynağı (bkz. 0133_kurumsal_site.sql): panel
// API'si kaydederken, vitrin sayfası okurken aynı şemadan geçirir. Bozuk ya
// da eski biçimdeki kayıt vitrinde null sayılır (sayfa 404), panelde
// varsayılanlarla yeniden doldurulur.

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function trimmed(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} en fazla ${max} karakter olabilir.`);
}

// Boş string'i undefined'a çevirir: formdan gelen "" alanı "girilmedi" sayılır.
function optionalText(max: number, label: string) {
  return z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? undefined : value),
    trimmed(max, label).optional(),
  );
}

// Görsel adresi yalnız http(s) ya da site içi kök yolu ("/gate/..."); başka
// şema (javascript:, data:) <img src>'ye hiç girmesin.
const imageUrlSchema = z
  .string()
  .trim()
  .max(1000, "Görsel adresi çok uzun.")
  .refine(
    (value) => /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//")),
    "Görsel adresi geçersiz.",
  );

export const kurumsalHighlightSchema = z.object({
  title: z.string().trim().min(1, "Başlık boş olamaz.").max(60, "Başlık en fazla 60 karakter olabilir."),
  body: trimmed(240, "Açıklama"),
});

export const kurumsalBadgeSchema = z.object({
  value: z.string().trim().min(1).max(20, "Rozet değeri en fazla 20 karakter olabilir."),
  label: z.string().trim().min(1).max(30, "Rozet etiketi en fazla 30 karakter olabilir."),
});

export const kurumsalSectionsSchema = z.object({
  featured: z.boolean().default(true),
  steps: z.boolean().default(true),
  map: z.boolean().default(true),
  form: z.boolean().default(true),
});

export const kurumsalContentSchema = z.object({
  sector: z.string().trim().min(1).max(40),
  eyebrow: trimmed(60, "Üst etiket"),
  headline: z.string().trim().min(1, "Ana başlık boş olamaz.").max(90, "Ana başlık en fazla 90 karakter olabilir."),
  tagline: trimmed(260, "Slogan"),
  about: z
    .array(z.string().trim().min(1).max(1200, "Bir paragraf en fazla 1200 karakter olabilir."))
    .max(4, "Hakkımızda en fazla 4 paragraf olabilir."),
  legal_name: optionalText(160, "Unvan"),
  phone: optionalText(40, "Telefon"),
  founded_year: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number()
      .int("Kuruluş yılı geçersiz.")
      .min(1800, "Kuruluş yılı geçersiz.")
      .max(new Date().getFullYear(), "Kuruluş yılı gelecekte olamaz.")
      .optional(),
  ),
  city: optionalText(60, "İl"),
  customer_type: optionalText(40, "Müşteri tipi"),
  highlights: z.array(kurumsalHighlightSchema).max(4, "En fazla 4 öne çıkan özellik seçilebilir."),
  badge: kurumsalBadgeSchema.nullable().optional(),
  hero_image_url: imageUrlSchema.nullable().optional(),
  accent_color: z
    .string()
    .trim()
    .regex(HEX_COLOR_RE, "Renk #RRGGBB biçiminde olmalı.")
    .nullable()
    .optional(),
  sections: kurumsalSectionsSchema.default({ featured: true, steps: true, map: true, form: true }),
});

export type KurumsalContent = z.output<typeof kurumsalContentSchema>;
export type KurumsalHighlight = z.output<typeof kurumsalHighlightSchema>;
export type KurumsalSections = z.output<typeof kurumsalSectionsSchema>;

export interface KurumsalSiteRecord {
  is_published: boolean;
  content: KurumsalContent;
  published_at: string | null;
  updated_at: string | null;
}

/** DB'den gelen jsonb'yi doğrular; geçersizse null (sayfa 404 / panelde varsayılan). */
export function parseKurumsalContent(value: unknown): KurumsalContent | null {
  const parsed = kurumsalContentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Sihirbaz ilk açıldığında formu doldurmak için tenant/ayar verisinden
 * türetilen başlangıç içeriği. Hiçbir şey uydurmaz: sektör hazır metinleri
 * yalnız elde olan bilgilerle (firma adı, müşteri tipi) doldurulur, eksik
 * bilgili cümleler düşer (bkz. renderTemplate).
 */
export function defaultKurumsalContent(
  tenant: Pick<Tenant, "company_name" | "sector">,
  settings: Pick<
    TenantStorefrontSettings,
    "storefront_description" | "hero_heading" | "footer_phone" | "storefront_title"
  >,
): KurumsalContent {
  const sector = resolveSectorKey(tenant.sector);
  const preset = getKurumsalPreset(sector);
  const firma = settings.storefront_title?.trim() || tenant.company_name;
  const vars = { firma, musteri: DEFAULT_CUSTOMER_TYPE.dative };
  const description = settings.storefront_description?.trim() ?? "";
  const presetAbout = renderTemplate(preset.about[0], vars);

  return {
    sector,
    eyebrow: preset.eyebrows[0],
    headline: (settings.hero_heading?.trim() || firma).slice(0, 90),
    tagline: (description || renderTemplate(preset.taglines[0], vars)).slice(0, 260),
    about: [description && description.length > 80 ? description : presetAbout]
      .filter(Boolean)
      .map((paragraph) => paragraph.slice(0, 1200)),
    phone: settings.footer_phone?.trim() || undefined,
    customer_type: DEFAULT_CUSTOMER_TYPE.key,
    highlights: pickDefaultHighlights(sector, vars),
    badge: null,
    hero_image_url: null,
    accent_color: null,
    sections: { featured: true, steps: true, map: true, form: true },
  };
}
