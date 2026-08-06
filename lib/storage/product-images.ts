import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeFileName,
  STORE_ASSETS_BUCKET,
} from "@/lib/storage/storage-helpers";

export const PRODUCT_IMAGES_BUCKET = STORE_ASSETS_BUCKET;

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export class ProductImageValidationError extends Error {}

export function validateProductImageFile(file: File) {
  if (!isImageFile(file)) {
    throw new ProductImageValidationError(
      "Sadece resim dosyası yükleyebilirsiniz.",
    );
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    throw new ProductImageValidationError(
      "Resim dosyası çok büyük. En fazla 10MB yükleyebilirsiniz.",
    );
  }
}

export function buildProductImagePath(params: {
  tenantId: string;
  productId: string;
  fileName: string;
  slot?: 1 | 2 | 3;
}) {
  const slotSuffix = params.slot && params.slot > 1 ? `-${params.slot}` : "";
  return `${params.tenantId}/products/${params.productId}${slotSuffix}-${sanitizeFileName(
    params.fileName,
  )}`;
}

export function buildTenantBrandingPath(params: {
  tenantId: string;
  fileName: string;
}) {
  return `${params.tenantId}/branding/logo-${sanitizeFileName(params.fileName)}`;
}

export async function uploadProductImage(params: {
  supabase: SupabaseClient;
  tenantId: string;
  productId: string;
  file: File;
  slot?: 1 | 2 | 3;
}) {
  validateProductImageFile(params.file);

  const filePath = buildProductImagePath({
    tenantId: params.tenantId,
    productId: params.productId,
    fileName: params.file.name,
    slot: params.slot,
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