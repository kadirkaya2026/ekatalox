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

const optionalPositiveIntegerSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();

    if (!normalized) {
      return null;
    }

    const parsedValue = Number(normalized);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paket ve koli adetleri pozitif tam sayı olmalıdır.",
      });
      return z.NEVER;
    }

    return parsedValue;
  });

const nonNegativeIntegerSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const normalized = String(value).trim();
    const parsedValue = Number(normalized);

    if (!normalized || !Number.isInteger(parsedValue) || parsedValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stok alanı sıfır veya pozitif tam sayı olmalıdır.",
      });
      return z.NEVER;
    }

    return parsedValue;
  });

const booleanSchema = z
  .union([z.boolean(), z.string()])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"));

export const productBaseSchema = z.object({
  category_id: z.string().min(1, "Kategori seçimi zorunludur."),
  sku_code: z.string().min(1, "Stok kodu zorunludur."),
  product_name: z.string().min(2, "Ürün adı zorunludur."),
  currency: currencyCodeSchema,
  price_tier_1: z.coerce.number().min(0),
  price_tier_2: z.coerce.number().min(0),
  price_tier_3: z.coerce.number().min(0),
  is_in_stock: booleanSchema,
  package_quantity: optionalPositiveIntegerSchema,
  carton_quantity: optionalPositiveIntegerSchema,
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
  is_in_stock: booleanSchema,
  image_url: imageUrlSchema,
  package_quantity: optionalPositiveIntegerSchema,
  carton_quantity: optionalPositiveIntegerSchema,
});

export const productImportRowsSchema = z.array(productImportRowSchema);

export const productBulkDeleteSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "En az bir ürün seçin."),
});

export const productReorderSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "Sıralanacak ürün bulunamadı."),
});

export const productBulkCategoryUpdateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "En az bir ürün seçin."),
  category_id: z.string().uuid("Geçerli bir kategori seçin."),
});

export const productVariantBulkUpdateSchema = z.object({
  productId: z.string().uuid("Geçerli bir ürün seçin."),
  variants: z.array(
    z.object({
      id: z
        .union([z.string().uuid(), z.literal(""), z.undefined()])
        .transform((value) => (value ? value : undefined)),
      model_name: z
        .string()
        .trim()
        .min(1, "Model adı zorunludur."),
      stock_quantity: nonNegativeIntegerSchema,
      package_quantity: optionalPositiveIntegerSchema,
      carton_quantity: optionalPositiveIntegerSchema,
      is_available_for_sale: booleanSchema,
      display_order: z.coerce.number().int().min(1).optional(),
    }),
  ).min(1, "En az bir varyant girin."),
});

export const storefrontVariantAvailabilitySchema = z.object({
  subdomain: z.string().trim().min(1, "Subdomain gereklidir."),
  productId: z.string().uuid("Geçerli bir ürün seçin."),
  selections: z.array(
    z.object({
      variantId: z.string().uuid("Geçerli bir model seçin."),
      unit: z.enum(["adet", "paket", "koli"]),
      quantity: z.coerce.number().int().min(1, "Adet en az 1 olmalıdır."),
    }),
  ).min(1, "En az bir model seçin."),
});