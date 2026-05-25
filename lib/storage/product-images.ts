import type { SupabaseClient } from "@supabase/supabase-js";

const PRODUCT_IMAGES_BUCKET = "product-images";

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

export function buildProductImagePath(params: {
  tenantId: string;
  productId: string;
  fileName: string;
}) {
  return `${params.tenantId}/products/${params.productId}-${sanitizeFileName(
    params.fileName,
  )}`;
}

export async function uploadProductImage(params: {
  supabase: SupabaseClient;
  tenantId: string;
  productId: string;
  file: File;
}) {
  const filePath = buildProductImagePath({
    tenantId: params.tenantId,
    productId: params.productId,
    fileName: params.file.name,
  });

  const { error } = await params.supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, params.file, {
      upsert: true,
      contentType: params.file.type || "image/jpeg",
    });

  if (error) {
    throw error;
  }

  const { data } = params.supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export function isImageFile(file: File | null) {
  return Boolean(file && file.type.startsWith("image/"));
}