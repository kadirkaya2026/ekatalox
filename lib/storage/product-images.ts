import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeFileName,
  STORE_ASSETS_BUCKET,
} from "@/lib/storage/storage-helpers";

export const PRODUCT_IMAGES_BUCKET = STORE_ASSETS_BUCKET;

export function buildProductImagePath(params: {
  tenantId: string;
  productId: string;
  fileName: string;
}) {
  return `${params.tenantId}/products/${params.productId}-${sanitizeFileName(
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