import { z } from "zod";

export const storefrontThemeKeySchema = z.enum([
  "minimal",
  "premium-dark",
  "soft-commerce",
]);

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
  theme_key: storefrontThemeKeySchema,
});

export const allowedLogoMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const maxLogoFileSizeBytes = 1024 * 1024;