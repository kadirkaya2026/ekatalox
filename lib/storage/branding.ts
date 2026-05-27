import {
  sanitizeFileName,
  STORE_ASSETS_BUCKET,
} from "@/lib/storage/storage-helpers";

export const STOREFRONT_BRANDING_BUCKET = STORE_ASSETS_BUCKET;

export function buildTenantBrandingPath(params: {
  tenantId: string;
  fileName: string;
}) {
  return `${params.tenantId}/branding/logo-${sanitizeFileName(params.fileName)}`;
}

export function buildTenantFaviconPath(params: {
  tenantId: string;
  fileName: string;
}) {
  return `${params.tenantId}/branding/favicon-${sanitizeFileName(params.fileName)}`;
}