import { z } from "zod";

export const stockImportSourceRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  barcode: z.string().trim().min(1).nullable(),
  productName: z.string().trim().min(1).nullable(),
  price: z.number().nonnegative().nullable(),
});

export const stockImportMatchRequestSchema = z.object({
  rows: z.array(stockImportSourceRowSchema).min(1, "Yüklenecek satır bulunamadı.").max(50_000),
});

export const stockImportApplyRowSchema = z
  .object({
    // Tenant'ta zaten var olan bir ürünle eşleşen satırlar için dolu.
    productId: z.string().uuid("Geçerli bir ürün seçin.").nullable().optional(),
    // Barkodu Master Katalog'da bulunan ama tenant'ta henüz olmayan satırlar
    // için dolu — apply aşamasında önce bu sku_code tenant'a aktarılır,
    // sonra normal akışla (stok aç + fiyat yaz) devam edilir. İkisinden
    // tam olarak biri dolu olmalı (aşağıdaki .refine).
    masterCatalogSkuCode: z.string().trim().min(1).nullable().optional(),
    priceListId: z.string().uuid("Geçerli bir fiyat listesi seçin."),
    price: z.coerce.number().min(0, "Fiyat sıfırdan küçük olamaz."),
    // Satırın dosyadaki barkodu — isimle/manuel eşleştirilen ürünlerin
    // sku_code'unu buna göre düzeltmek için (bkz. apply/route.ts). Barkod
    // zaten tam eşleştiyse (matched_exact) sku_code=barcode olduğundan bu
    // bir no-op'tur; asıl fayda isim/manuel eşleşmelerde ortaya çıkar.
    barcode: z.string().trim().min(1).nullable().optional(),
  })
  .refine((row) => Boolean(row.productId) || Boolean(row.masterCatalogSkuCode), {
    message: "productId veya masterCatalogSkuCode belirtilmeli.",
  });

export const stockImportApplyRequestSchema = z.object({
  updates: z.array(stockImportApplyRowSchema).min(1, "Uygulanacak satır seçilmedi.").max(50_000),
});

export type StockImportSourceRowInput = z.infer<typeof stockImportSourceRowSchema>;
export type StockImportApplyRowInput = z.infer<typeof stockImportApplyRowSchema>;
