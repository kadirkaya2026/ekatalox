import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ProductImageValidationError,
  validateProductImageFile,
} from "@/lib/storage/product-images";

// Master Katalog görselleri TEK MERKEZİ kopyada durur: tüm tenant'lar aynı
// dosyaya işaret eder (import ederken sadece image_url string'i kopyalanır),
// bu yüzden dosya tenant başına çoğaltılmaz. Dış CDN'e (ör. market siteleri)
// hotlink bırakılmaz — link çürür ve trafiği başkasının sunucusundan çekmiş
// oluruz. Aynı kural scripts/upload-market-catalog-images-to-storage.js'te de
// geçerli; dosya adı orayla aynı düzende ({sku}.{uzantı}) tutulmalı ki
// tekrar yükleme eski kopyanın üzerine yazsın.
export const MARKET_CATALOG_IMAGES_BUCKET = "market-catalog-images";

export { ProductImageValidationError };

function resolveExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|gif|avif)$/.test(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  const fromType = file.type.split("/").pop()?.toLowerCase();
  if (fromType && /^(jpe?g|png|webp|gif|avif)$/.test(fromType)) {
    return fromType === "jpeg" ? "jpg" : fromType;
  }

  return "jpg";
}

export function buildMarketCatalogImagePath(skuCode: string, file: File) {
  const safeSku = skuCode.replace(/[^\w.-]+/g, "-").toLowerCase();
  return `${safeSku}.${resolveExtension(file)}`;
}

export async function uploadMarketCatalogImage(params: {
  supabase: SupabaseClient;
  skuCode: string;
  file: File;
}) {
  validateProductImageFile(params.file);

  const filePath = buildMarketCatalogImagePath(params.skuCode, params.file);

  const { error } = await params.supabase.storage
    .from(MARKET_CATALOG_IMAGES_BUCKET)
    .upload(filePath, params.file, {
      upsert: true,
      contentType: params.file.type || "image/jpeg",
    });

  if (error) {
    throw error;
  }

  const { data } = params.supabase.storage
    .from(MARKET_CATALOG_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  // Aynı sku için tekrar yükleme yapıldığında CDN'in eski kopyayı servis
  // etmemesi için sürüm damgası ekleniyor.
  return `${data.publicUrl}?v=${Date.now()}`;
}
