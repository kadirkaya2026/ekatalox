import { z } from "zod";
import { DEFAULT_INSTALLMENT_OPTIONS } from "@/lib/storefront/cart";

export const storefrontThemeKeySchema = z.enum([
  "minimal",
  "premium-dark",
  "soft-commerce",
]);

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
    cta_href: droppedBannerActionSchema,
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
    banner_items: z
      .array(bannerItemSchema)
      .max(6, "En fazla 6 banner ekleyebilirsiniz.")
      .default([]),
    theme_key: storefrontThemeKeySchema,
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
    discount_threshold: z.coerce
      .number()
      .min(0, "İskonto barajı negatif olamaz.")
      .default(0),
    discount_percentage: z.coerce
      .number()
      .min(0, "İskonto oranı negatif olamaz.")
      .max(100, "İskonto oranı en fazla %100 olabilir.")
      .default(0),
    is_discount_active: z.boolean().default(false),
    discount_condition_note: z
      .string()
      .max(300, "Şart notu en fazla 300 karakter olabilir.")
      .nullable()
      .optional()
      .default(null),
    discount_payment_method: z.enum(["cash", "card"]).default("cash"),
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
    cash_discount_threshold: z.coerce.number().min(0).default(0),
    cash_discount_percentage: z.coerce.number().min(0).max(100).default(0),
    is_cash_discount_active: z.boolean().default(false),
    cash_discount_note: z.string().max(300).nullable().optional().default(null),
    // Bağımsız kart kampanyası (0 komisyon)
    card_campaign_threshold: z.coerce.number().min(0).default(0),
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

    if (value.is_cash_discount_active && value.cash_discount_threshold <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_discount_threshold"],
        message: "Nakit kampanyasını yayına almak için baraj 0'dan büyük olmalıdır.",
      });
    }

    if (value.is_cash_discount_active && value.cash_discount_percentage <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_discount_percentage"],
        message: "Nakit kampanyasını yayına almak için iskonto oranı 0'dan büyük olmalıdır.",
      });
    }

    if (value.is_card_campaign_active && value.card_campaign_threshold <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["card_campaign_threshold"],
        message: "Kart kampanyasını yayına almak için baraj 0'dan büyük olmalıdır.",
      });
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

export const allowedFaviconMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

export const maxFaviconFileSizeBytes = 512 * 1024;
