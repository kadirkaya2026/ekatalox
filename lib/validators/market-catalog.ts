import { z } from "zod";
import { MARKET_CATEGORY_ANCESTORS } from "@/lib/market-catalog/category-taxonomy";

// Master Katalog satırını SADECE süper admin düzenleyebilir (bkz.
// app/api/admin/market-catalog/[id]/route.ts ve 0056_market_catalog.sql'deki
// RLS politikaları). Tenant tarafında bu tabloya güncelleme yapan hiçbir yol
// yok; stok listesi yükleme yalnızca HENÜZ OLMAYAN barkodlar için yeni satır
// ekliyor (ignoreDuplicates), mevcut satırı değiştirmiyor.
//
// category_name serbest metin değil: tenant import'unda kategori ağacı bu
// anahtarlardan türetiliyor (resolveCategoryPath), taksonomide olmayan bir ad
// kök seviyede kalıp yanlış yere düşerdi.
export const marketCatalogUpdateSchema = z.object({
  product_name: z.string().trim().min(1, "Ürün adı zorunludur."),
  sku_code: z.string().trim().min(1, "Barkod zorunludur."),
  brand: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .optional(),
  category_name: z
    .string()
    .trim()
    .refine((value) => value in MARKET_CATEGORY_ANCESTORS, "Geçersiz kategori seçimi."),
  reference_price: z
    .number()
    .nonnegative("Fiyat negatif olamaz.")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .optional(),
  image_url: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .optional(),
});

export type MarketCatalogUpdateInput = z.infer<typeof marketCatalogUpdateSchema>;
