import { z } from "zod";
import { isCurrencyCode, normalizeCurrencyCode } from "@/lib/products/constants";
import {
  getDescriptionPlainTextLength,
  normalizeProductDescription,
  PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH,
} from "@/lib/products/description-html";
import { productPricesSchema } from "@/lib/validators/price-list";

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

const optionalDiscountPriceSchema = z
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

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "İndirimli fiyat sıfır veya pozitif olmalıdır.",
      });
      return z.NEVER;
    }

    return parsedValue;
  });

export const productBaseSchema = z.object({
  category_id: z.string().min(1, "Kategori seçimi zorunludur."),
  sku_code: z.string().min(1, "Model No zorunludur."),
  product_name: z.string().min(2, "Ürün adı zorunludur."),
  currency: currencyCodeSchema,
  prices: productPricesSchema.min(1, "En az bir fiyat listesi girilmelidir."),
  is_in_stock: booleanSchema,
  is_recommended: z.preprocess(
    (value) => (value === null || value === undefined ? "false" : value),
    booleanSchema,
  ),
  package_quantity: optionalPositiveIntegerSchema,
  carton_quantity: optionalPositiveIntegerSchema,
  description: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value : ""))
    .pipe(
      z
        .string()
        .superRefine((value, ctx) => {
          const trimmed = value.trim();

          if (!trimmed) {
            return;
          }

          if (
            getDescriptionPlainTextLength(trimmed) >
            PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Ürün detayı en fazla 2000 karakter olabilir.",
            });
          }
        })
        .transform((value) => normalizeProductDescription(value)),
    ),
  is_discount_active: z.preprocess(
    (value) => (value === null || value === undefined ? "false" : value),
    booleanSchema,
  ),
  discount_price: optionalDiscountPriceSchema,
}).superRefine((value, ctx) => {
  if (!value.is_discount_active) {
    return;
  }

  if (value.discount_price === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "İndirim aktifken indirimli satış fiyatı zorunludur.",
      path: ["discount_price"],
    });
    return;
  }

  const minListPrice = Math.min(...value.prices.map((entry) => entry.price));

  if (minListPrice <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "İndirim uygulamak için en az bir liste fiyatı sıfırdan büyük olmalıdır.",
      path: ["discount_price"],
    });
    return;
  }

  if (value.discount_price >= minListPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "İndirimli fiyat, liste fiyatından düşük olmalıdır.",
      path: ["discount_price"],
    });
  }
});

export const productCreateSchema = productBaseSchema.extend({
  tenant_id: z.string().min(1).optional(),
});

// İçe aktarma satırları fiyatları liste adıyla taşır (price_list_id eşleşmesi
// sunucuda doğrulamadan sonra resolveImportPricesForTenant ile yapılır), bu
// yüzden form akışındaki productPricesSchema (price_list_id bekler) kullanılamaz.
const importListPriceSchema = z.array(
  z.object({
    list_name: z.string().min(1, "Fiyat listesi adı zorunludur."),
    price: z.coerce.number().min(0, "Fiyat sıfırdan küçük olamaz."),
  }),
);

export const productImportRowSchema = z.object({
  category_name: z.string().min(1, "Kategori adı zorunludur."),
  sku_code: z.string().min(1, "Model No zorunludur."),
  product_name: z.string().min(2, "Ürün adı zorunludur."),
  currency: currencyCodeSchema,
  prices: importListPriceSchema,
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

export const productMoveOrderSchema = z.object({
  productId: z.string().min(1, "Geçerli bir ürün seçin."),
  targetOrder: z.coerce.number().int().min(1, "Sıra numarası en az 1 olmalıdır."),
});

export const productReorderRequestSchema = z.union([
  productMoveOrderSchema,
  productReorderSchema,
]);

export const productBulkCategoryUpdateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "En az bir ürün seçin."),
  category_id: z.string().uuid("Geçerli bir kategori seçin."),
});

export const productVariantBulkUpdateSchema = z.object({
  productId: z.string().uuid("Geçerli bir ürün seçin."),
  variants: z.array(
    z.object({
      id: z
        .string()
        .uuid("Geçerli bir varyant seçin.")
        .or(z.literal(""))
        .optional()
        .transform((value) => (value ? value : undefined)),
      model_name: z
        .string()
        .trim()
        .min(1, "Model adı zorunludur."),
      stock_quantity: nonNegativeIntegerSchema.optional(),
      package_quantity: optionalPositiveIntegerSchema,
      carton_quantity: optionalPositiveIntegerSchema,
      is_available_for_sale: booleanSchema.optional().default(true),
      display_order: z.coerce.number().int().min(1).optional(),
      prices: productPricesSchema.optional(),
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

export const storefrontProductDescriptionSchema = z.object({
  subdomain: z.string().trim().min(1, "Subdomain gereklidir."),
  productId: z.string().uuid("Geçerli bir ürün seçin."),
});