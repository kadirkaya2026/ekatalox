import { z } from "zod";

export const productBaseSchema = z.object({
  sku_code: z.string().min(1, "Stok kodu zorunludur."),
  product_name: z.string().min(2, "Ürün adı zorunludur."),
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