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
    // Satır hiçbir mevcut ürünle (tenant'ta veya Master Katalog'da)
    // eşleşmediğinde, kullanıcı bunu tenant'ta sıfırdan yeni bir ürün olarak
    // oluşturmayı seçebilir — kategori seçimi UI'da zorunlu kılınır, burada
    // da şemayla tekrar doğrulanır (bkz. apply/route.ts).
    newProduct: z
      .object({
        categoryId: z.string().uuid("Geçerli bir kategori seçin.").nullable().optional(),
        // categoryId yerine — tenant'ta o isimde bir kategori henüz yoksa
        // (ör. yeni açılan, ürünü sıfır bir tenant'ta kategori dropdown'ı
        // boş olur) kullanıcı elle yeni bir kategori adı girebilir; apply
        // aşamasında Master Katalog importundakiyle (bkz.
        // import-from-master-catalog.ts) aynı ensureCategoryPath ile
        // oluşturulur/eşleştirilir. İkisinden tam olarak biri dolu olmalı
        // (aşağıdaki .refine).
        newCategoryName: z.string().trim().min(1, "Kategori adı gerekli.").nullable().optional(),
        productName: z.string().trim().min(1, "Ürün adı gerekli."),
        skuCode: z.string().trim().min(1, "Barkod/SKU gerekli."),
        // Yükleme akışında ayrı bir uploda-image çağrısıyla önceden
        // yüklenip Supabase Storage public URL'i olarak buraya konur.
        imageUrl: z.string().trim().url().nullable().optional(),
      })
      .refine((value) => Boolean(value.categoryId) || Boolean(value.newCategoryName), {
        message: "Kategori seçin veya yeni bir kategori adı girin.",
        path: ["categoryId"],
      })
      .nullable()
      .optional(),
    priceListId: z.string().uuid("Geçerli bir fiyat listesi seçin."),
    price: z.coerce.number().min(0, "Fiyat sıfırdan küçük olamaz."),
    // Satırın dosyadaki barkodu — isimle/manuel eşleştirilen ürünlerin
    // sku_code'unu buna göre düzeltmek için (bkz. apply/route.ts). Barkod
    // zaten tam eşleştiyse (matched_exact) sku_code=barcode olduğundan bu
    // bir no-op'tur; asıl fayda isim/manuel eşleşmelerde ortaya çıkar.
    barcode: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (row) => Boolean(row.productId) || Boolean(row.masterCatalogSkuCode) || Boolean(row.newProduct),
    { message: "productId, masterCatalogSkuCode veya newProduct belirtilmeli." },
  );

export const stockImportApplyRequestSchema = z.object({
  updates: z.array(stockImportApplyRowSchema).min(1, "Uygulanacak satır seçilmedi.").max(50_000),
});

export type StockImportSourceRowInput = z.infer<typeof stockImportSourceRowSchema>;
export type StockImportApplyRowInput = z.infer<typeof stockImportApplyRowSchema>;
