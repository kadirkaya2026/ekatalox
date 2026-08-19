import { z } from "zod";

export const productSuggestionCreateSchema = z.object({
  barcode: z.string().trim().min(1, "Barkod zorunludur."),
  product_name: z.string().trim().min(1, "Ürün adı zorunludur."),
  price: z.number().nonnegative().nullable().optional(),
});

// Süper admin onaylamadan önce ad/fiyat/barkod/görseli düzeltebilir
// (kullanıcı isteği, 19 Ağu 2026) — hepsi opsiyonel, boş bırakılırsa
// önerideki orijinal değer kullanılır (bkz. approve/route.ts).
export const productSuggestionApproveSchema = z.object({
  category_name: z.string().trim().min(1, "Kategori seçin."),
  product_name: z.string().trim().min(1).optional(),
  barcode: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().nullable().optional(),
  image_url: z.string().trim().min(1).nullable().optional(),
});
