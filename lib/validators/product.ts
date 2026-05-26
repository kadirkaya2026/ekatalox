import { z } from "zod";
import { isCurrencyCode, normalizeCurrencyCode } from "@/lib/products/constants";

export const currencyCodeSchema = z
  .string()
  .transform(normalizeCurrencyCode)
  .refine((value) => isCurrencyCode(value), {
    message: "Geçerli bir para birimi seçin.",
  });

const imageUrlSchema = z
  .union([z.string().url("Geçerli bir görsel adresi girin."), z.literal(""), z.null(), z.undefined()])
  .transform((value) => value || null);

export const productBaseSchema = z.object({
  category_id: z.string().min(1, "Kategori seçimi zorunludur."),
  sku_code: z.string().min(1, "Stok kodu zorunludur."),
  product_name: z.string().min(2, "Ürün adı zorunludur."),
  currency: currencyCodeSchema,
  price_tier_1: z.coerce.number().min(0),
  price_tier_2: z.coerce.number().min(0),
  price_tier_3: z.coerce.number().min(0),
  is_in_stock: z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === "boolean" ? value : value === "true")),
});

export const productCreateSchema = productBaseSchema.extend({
  tenant_id: z.string().min(1).optional(),
});

export const productImportRowSchema = z.object({
  category_name: z.string().min(1, "Kategori adı zorunludur."),
  sku_code: z.string().min(1, "Stok kodu zorunludur."),
  product_name: z.string().min(2, "Ürün adı zorunludur."),
  currency: currencyCodeSchema,
  price_tier_1: z.coerce.number().min(0),
  price_tier_2: z.coerce.number().min(0),
  price_tier_3: z.coerce.number().min(0),
  is_in_stock: z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === "boolean" ? value : value === "true")),
  image_url: imageUrlSchema,
});

export const productImportRowsSchema = z.array(productImportRowSchema);

export const productBulkDeleteSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "En az bir ürün seçin."),
});