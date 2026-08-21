import {
  getStorageObjectPathFromPublicUrl,
  sanitizeFileName,
} from "@/lib/storage/storage-helpers";

export const STOREFRONT_BANNERS_BUCKET = "storefront-banners";

const extensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getBannerFileExtension(params: {
  contentType?: string | null;
  fileName?: string | null;
}) {
  if (params.contentType && extensionMap[params.contentType]) {
    return extensionMap[params.contentType];
  }

  const sanitizedName = sanitizeFileName(params.fileName ?? "");
  const extension = sanitizedName.split(".").pop();

  if (extension === "jpeg") {
    return "jpg";
  }

  if (extension === "jpg" || extension === "png" || extension === "webp") {
    return extension;
  }

  return "jpg";
}

export function buildTenantBannerPath(params: {
  tenantId: string;
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/banner_${Date.now()}.${extension}`;
}

// Kampanya görselleri de banner bucket'ına yazılıyor: RLS ${tenantId}/
// önekine göre çalıştığı için (storage_object_tenant_prefix, bkz. 0011)
// yeni bucket ve yeni politika gerekmiyor.
export function buildTenantCampaignImagePath(params: {
  tenantId: string;
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/campaign_${Date.now()}.${extension}`;
}

export function buildHeroClusterImagePath(params: {
  tenantId: string;
  slot: "large" | "side";
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/hero_cluster_${params.slot}_${Date.now()}.${extension}`;
}

export function buildCategoryBannerPath(params: {
  tenantId: string;
  categoryId: string;
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/category_${params.categoryId}/banner_${Date.now()}.${extension}`;
}

export function buildCategoryTilePath(params: {
  tenantId: string;
  categoryId: string;
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/category_${params.categoryId}/tile_${Date.now()}.${extension}`;
}

export function getBannerObjectPath(fileUrl: string | null) {
  return getStorageObjectPathFromPublicUrl(fileUrl, STOREFRONT_BANNERS_BUCKET);
}
