import { z } from "zod";
import { DEFAULT_INSTALLMENT_OPTIONS } from "@/lib/storefront/cart";
import { DEFAULT_HOMEPAGE_BLOCKS, HOMEPAGE_BLOCK_IDS } from "@/lib/storefront/homepage-blocks";

export const storefrontThemeKeySchema = z.enum([
  "minimal",
  "pro-blue",
  "neutral",
  "industrial",
  "premium",
  "catalog-first",
  "market",
  "vitrin-pro",
]);

export const storefrontLayoutKeySchema = z.enum([
  "classic-grid",
  "catalog-dense",
  "catalog-list",
  "sidebar-pro",
]);

export const storefrontFontKeySchema = z.enum([
  "inter",
  "dm-sans",
  "plus-jakarta",
  "source-sans",
  "playfair",
]);

export const storefrontProductCardStyleSchema = z.enum([
  "standard",
  "compact",
  "image-forward",
]);

export const productImageBackgroundSchema = z.enum(["theme", "white", "transparent"]);

export const storefrontHeaderStyleKeySchema = z.enum([
  "standard",
  "centered",
  "minimal",
  "split",
]);

export const storefrontFooterStyleKeySchema = z.enum(["standard", "minimal", "columns"]);

export const storefrontHeroStyleKeySchema = z.enum(["text", "image-split", "full-bleed"]);

export const recommendationModeSchema = z.enum(["auto", "manual"]);

export const storefrontDefaultLocaleSchema = z.enum(["tr", "de", "en", "ru"]);

export const homepageBlockIdSchema = z.enum([
  "hero",
  "heroCluster",
  "promoTiles",
  "categoryTiles",
  "banner",
  "campaigns",
  "showcase",
  "banner2",
  "catalog",
]);

export const homepageBlockSchema = z.object({
  id: homepageBlockIdSchema,
  visible: z.boolean(),
  order: z.coerce.number().int().min(1).max(10),
});

export const homepageBlocksSchema = z
  .array(homepageBlockSchema)
  .min(1)
  .max(HOMEPAGE_BLOCK_IDS.length)
  .default(DEFAULT_HOMEPAGE_BLOCKS);

const optionalUrlSchema = z
  .union([z.string().trim().url("Geçerli bir bağlantı girin."), z.literal(""), z.null(), z.undefined()])
  .transform((value) => value || null);

const droppedBannerActionSchema = z
  .union([z.string().trim(), z.literal(""), z.null(), z.undefined()])
  .transform(() => null);

const optionalColorSchema = z
  .union([z.string().trim(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => value || null)
  .refine(
    (value) =>
      value === null || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value),
    {
      message: "Renk değeri HEX formatında olmalıdır.",
    },
  );

const optionalAnnouncementTextSchema = (maxLength: number, message: string) =>
  z
    .union([z.string().trim().max(maxLength, message), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value.trim() || null : null));

const optionalFooterTextSchema = (maxLength: number, message: string) =>
  z
    .union([z.string().trim().max(maxLength, message), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value.trim() || null : null));

const optionalWhatsappFooterSchema = z
  .union([
    z.string().trim().max(120, "WhatsApp alanı en fazla 120 karakter olabilir."),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => (typeof value === "string" ? value.trim() || null : null));

export const bannerItemSchema = z
  .object({
    id: z.string().min(1, "Banner kimliği zorunludur."),
    title: z
      .string()
      .trim()
      .max(80, "Banner başlığı en fazla 80 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    description: z
      .string()
      .trim()
      .max(180, "Banner açıklaması en fazla 180 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    image_url: optionalUrlSchema,
    cta_label: droppedBannerActionSchema,
    cta_href: optionalUrlSchema,
    background_color: optionalColorSchema,
  })
  .refine(
    (value) => Boolean(value.title || value.description || value.image_url),
    {
      message: "Her banner için en az başlık, açıklama veya görsel girin.",
    },
  );

export const storefrontSettingsSchema = z
  .object({
    whatsapp_number: z.string().min(10, "WhatsApp numarası zorunludur."),
    is_whatsapp_order_direct: z.boolean().default(true),
    storefront_title: z
      .string()
      .trim()
      .max(80, "Mağaza başlığı en fazla 80 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    storefront_description: z
      .string()
      .trim()
      .max(220, "Açıklama en fazla 220 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    hero_heading: z
      .string()
      .trim()
      .max(120, "Hero başlığı en fazla 120 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    hero_cta_label: z
      .string()
      .trim()
      .max(40, "Hero buton metni en fazla 40 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    hero_image_url: optionalUrlSchema,
    hero_style_key: storefrontHeroStyleKeySchema.default("text"),
    is_hero_visible: z.boolean().default(false),
    brand_primary_color: optionalColorSchema,
    brand_accent_color: optionalColorSchema,
    font_key: storefrontFontKeySchema.default("inter"),
    product_card_style: storefrontProductCardStyleSchema.default("standard"),
    product_image_background: productImageBackgroundSchema.default("theme"),
    header_style_key: storefrontHeaderStyleKeySchema.default("standard"),
    footer_style_key: storefrontFooterStyleKeySchema.default("standard"),
    homepage_blocks: homepageBlocksSchema,
    banner_items: z
      .array(bannerItemSchema)
      .max(6, "En fazla 6 banner ekleyebilirsiniz.")
      .default([]),
    theme_key: storefrontThemeKeySchema,
    layout_key: storefrontLayoutKeySchema.default("classic-grid"),
    site_tab_title: z
      .string()
      .trim()
      .max(80, "Sekme başlığı en fazla 80 karakter olabilir.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    site_favicon_url: optionalUrlSchema,
    announcement_title: optionalAnnouncementTextSchema(
      120,
      "Duyuru başlığı en fazla 120 karakter olabilir.",
    ),
    announcement_body: optionalAnnouncementTextSchema(
      1200,
      "Duyuru metni en fazla 1200 karakter olabilir.",
    ),
    is_active: z.boolean().default(false),
    max_display_count: z.coerce
      .number()
      .int("Maksimum gösterim sayısı tam sayı olmalıdır.")
      .min(1, "Maksimum gösterim sayısı en az 1 olmalıdır."),
    card_installment_options: z
      .array(
        z.object({
          count: z.number().int().positive(),
          label: z.string().min(1),
          isActive: z.boolean(),
          surchargePercentage: z.coerce
            .number()
            .min(0, "Vade farkı negatif olamaz.")
            .max(100, "Vade farkı en fazla %100 olabilir."),
        }),
      )
      .default(DEFAULT_INSTALLMENT_OPTIONS),
    // Bağımsız nakit kampanyası
    is_cash_discount_active: z.boolean().default(false),
    cash_discount_note: z.string().max(300).nullable().optional().default(null),
    // Bağımsız kart kampanyası (0 komisyon)
    is_card_campaign_active: z.boolean().default(false),
    card_campaign_note: z.string().max(300).nullable().optional().default(null),
    // Tier (basamaklı) kampanya dizileri
    cash_discount_tiers: z
      .array(
        z.object({
          threshold: z.coerce.number().min(0),
          percentage: z.coerce.number().min(0).max(100),
        }),
      )
      .default([]),
    card_campaign_tiers: z
      .array(
        z.object({
          threshold: z.coerce.number().min(0),
          maxFreeInstallmentCount: z.coerce.number().int().min(1).max(12),
        }),
      )
      .default([]),
    price_update_date: z
      .union([
        z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin."),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .transform((value) => (typeof value === "string" && value ? value : null)),
    is_price_update_date_visible: z.boolean().default(false),
    is_theme_toggle_visible: z.boolean().default(true),
    is_footer_visible: z.boolean().default(false),
    is_footer_logo_visible: z.boolean().default(true),
    is_footer_social_visible: z.boolean().default(false),
    is_footer_location_visible: z.boolean().default(false),
    is_footer_copyright_visible: z.boolean().default(false),
    footer_location: optionalFooterTextSchema(
      120,
      "Footer konumu en fazla 120 karakter olabilir.",
    ),
    footer_copyright: optionalFooterTextSchema(
      200,
      "Telif yazısı en fazla 200 karakter olabilir.",
    ),
    footer_instagram_url: optionalUrlSchema,
    footer_youtube_url: optionalUrlSchema,
    footer_x_url: optionalUrlSchema,
    footer_facebook_url: optionalUrlSchema,
    footer_whatsapp: optionalWhatsappFooterSchema,
    is_footer_instagram_visible: z.boolean().default(false),
    is_footer_youtube_visible: z.boolean().default(false),
    is_footer_x_visible: z.boolean().default(false),
    is_footer_facebook_visible: z.boolean().default(false),
    is_footer_whatsapp_visible: z.boolean().default(false),
    footer_website_url: optionalUrlSchema,
    is_footer_website_visible: z.boolean().default(false),
    footer_phone: optionalFooterTextSchema(
      30,
      "Telefon numarası en fazla 30 karakter olabilir.",
    ),
    footer_email: z
      .union([
        z.string().trim().email("Geçerli bir e-posta adresi girin."),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .transform((value) => (typeof value === "string" ? value.trim() || null : null)),
    is_footer_contact_visible: z.boolean().default(false),
    recommendation_mode: recommendationModeSchema.default("auto"),
    default_locale: storefrontDefaultLocaleSchema.default("tr"),
  })
  .superRefine((value, ctx) => {
    if (value.is_active) {
      if (!value.announcement_title) {
        ctx.addIssue({
          code: "custom",
          path: ["announcement_title"],
          message: "Yayına almak için duyuru başlığı zorunludur.",
        });
      }

      if (!value.announcement_body) {
        ctx.addIssue({
          code: "custom",
          path: ["announcement_body"],
          message: "Yayına almak için duyuru metni zorunludur.",
        });
      }
    }

    if (value.is_cash_discount_active && value.cash_discount_tiers.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_discount_tiers"],
        message: "Nakit kampanyasını aktif etmek için en az bir baraj tanımlanmalıdır.",
      });
    }

    if (value.is_card_campaign_active && value.card_campaign_tiers.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["card_campaign_tiers"],
        message: "Kart kampanyasını aktif etmek için en az bir baraj tanımlanmalıdır.",
      });
    }

    if (value.is_price_update_date_visible && !value.price_update_date) {
      ctx.addIssue({
        code: "custom",
        path: ["price_update_date"],
        message: "Vitrinde göstermek için fiyat güncelleme tarihi zorunludur.",
      });
    }
  });

export const allowedLogoMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const maxLogoFileSizeBytes = 1024 * 1024;

export const allowedBannerMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const maxBannerFileSizeBytes = 2 * 1024 * 1024;
export const requiredBannerWidth = 1200;
export const requiredBannerHeight = 400;

export const requiredCategoryTileWidth = 600;
export const requiredCategoryTileHeight = 600;

export const allowedHeroImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const maxHeroImageFileSizeBytes = 3 * 1024 * 1024;

export const allowedFaviconMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

export const maxFaviconFileSizeBytes = 512 * 1024;
