import { z } from "zod";

export const productSuggestionCreateSchema = z.object({
  barcode: z.string().trim().min(1, "Barkod zorunludur."),
  product_name: z.string().trim().min(1, "Ürün adı zorunludur."),
  price: z.number().nonnegative().nullable().optional(),
});

export const productSuggestionApproveSchema = z.object({
  category_name: z.string().trim().min(1, "Kategori seçin."),
});
