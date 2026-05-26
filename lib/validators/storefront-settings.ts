import { z } from "zod";

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

export const storefrontSettingsSchema = z.object({
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
    .max(40, "Buton yazısı en fazla 40 karakter olabilir.")
    .nullable()
    .optional()
    .transform((value) => value || null),
  banner_items: z
    .array(bannerItemSchema)
    .max(6, "En fazla 6 banner ekleyebilirsiniz.")
    .default([]),
  theme_key: storefrontThemeKeySchema,
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