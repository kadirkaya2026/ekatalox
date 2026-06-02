import { z } from "zod";
import { isCurrencyCode } from "@/lib/products/constants";

const salesUnitSchema = z.enum(["adet", "paket", "koli"]);

export const storefrontOrderPdfCartItemSchema = z.object({
  id: z.string().min(1),
  product_id: z.string().min(1),
  variant_id: z.string().nullable().optional(),
  variant_name: z.string().nullable().optional(),
  category_id: z.string().min(1),
  sku_code: z.string().optional(),
  product_name: z.string().min(1),
  image_url: z.string().nullable().optional(),
  is_in_stock: z.boolean(),
  currency: z.string().refine((value) => isCurrencyCode(value), {
    message: "Geçersiz para birimi.",
  }),
  price: z.number().finite().nonnegative().nullable(),
  package_quantity: z.number().int().positive().nullable().optional(),
  carton_quantity: z.number().int().positive().nullable().optional(),
  stock_quantity: z.number().int().nullable().optional(),
  quantity: z.number().int().positive(),
  sales_unit: salesUnitSchema.nullable().optional(),
  unit_quantity: z.number().int().positive().nullable().optional(),
});

const cashDiscountTierSchema = z.object({
  threshold: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

const cardCampaignTierSchema = z.object({
  threshold: z.number().min(0),
  maxFreeInstallmentCount: z.number().int().min(1).max(12),
});

const installmentOptionSchema = z.object({
  count: z.number().int().positive(),
  label: z.string().min(1),
  isActive: z.boolean(),
  surchargePercentage: z.number().min(0).max(100),
});

export const storefrontOrderPdfSchema = z
  .object({
    subdomain: z.string().trim().min(1, "Mağaza bilgisi zorunludur."),
    catalog_mode: z.boolean().optional().default(false),
    items: z.array(storefrontOrderPdfCartItemSchema).min(1, "Sepet boş olamaz."),
    customer_reference_name: z.string().trim().max(200).optional().default(""),
    note: z.string().max(500).nullable().optional(),
    paymentMethod: z.enum(["cash", "card"]).nullable().optional(),
    selectedInstallmentCount: z.number().int().positive().nullable().optional(),
    cashDiscountTiers: z.array(cashDiscountTierSchema).optional().default([]),
    isCashDiscountActive: z.boolean().optional().default(false),
    cardCampaignTiers: z.array(cardCampaignTierSchema).optional().default([]),
    isCardCampaignActive: z.boolean().optional().default(false),
    cardInstallmentOptions: z.array(installmentOptionSchema).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (value.catalog_mode) {
      return;
    }

    for (const [index, item] of value.items.entries()) {
      if (item.price === null || item.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fiyatlı modda sepet kalemlerinde geçerli fiyat olmalıdır.",
          path: ["items", index, "price"],
        });
      }
    }
  });

export type StorefrontOrderPdfInput = z.infer<typeof storefrontOrderPdfSchema>;
