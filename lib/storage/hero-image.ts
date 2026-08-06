import { STOREFRONT_BANNERS_BUCKET, getBannerFileExtension } from "@/lib/storage/banners";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";

export const STOREFRONT_HERO_BUCKET = STOREFRONT_BANNERS_BUCKET;

export function buildTenantHeroImagePath(params: {
  tenantId: string;
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/hero_${Date.now()}.${extension}`;
}

export function getHeroImageObjectPath(fileUrl: string | null) {
  return getStorageObjectPathFromPublicUrl(fileUrl, STOREFRONT_HERO_BUCKET);
}
