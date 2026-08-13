import { z } from "zod";

export const stockImportSourceRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  barcode: z.string().trim().min(1).nullable(),
  productName: z.string().trim().min(1).nullable(),
  price: z.number().nonnegative().nullable(),
});

export const stockImportMatchRequestSchema = z.object({
  rows: z.array(stockImportSourceRowSchema).min(1, "Yüklenecek satır bulunamadı.").max(10_000),
});

export const stockImportApplyRowSchema = z.object({
  productId: z.string().uuid("Geçerli bir ürün seçin."),
  priceListId: z.string().uuid("Geçerli bir fiyat listesi seçin."),
  price: z.coerce.number().min(0, "Fiyat sıfırdan küçük olamaz."),
  // Satırın dosyadaki barkodu — isimle/manuel eşleştirilen ürünlerin
  // sku_code'unu buna göre düzeltmek için (bkz. apply/route.ts). Barkod
  // zaten tam eşleştiyse (matched_exact) sku_code=barcode olduğundan bu
  // bir no-op'tur; asıl fayda isim/manuel eşleşmelerde ortaya çıkar.
  barcode: z.string().trim().min(1).nullable().optional(),
});

export const stockImportApplyRequestSchema = z.object({
  updates: z.array(stockImportApplyRowSchema).min(1, "Uygulanacak satır seçilmedi.").max(5_000),
});

export type StockImportSourceRowInput = z.infer<typeof stockImportSourceRowSchema>;
export type StockImportApplyRowInput = z.infer<typeof stockImportApplyRowSchema>;
