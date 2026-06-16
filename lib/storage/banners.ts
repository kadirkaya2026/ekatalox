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

export function buildCategoryBannerPath(params: {
  tenantId: string;
  categoryId: string;
  fileName?: string | null;
  contentType?: string | null;
}) {
  const extension = getBannerFileExtension(params);
  return `${params.tenantId}/category_${params.categoryId}/banner_${Date.now()}.${extension}`;
}

export function getBannerObjectPath(fileUrl: string | null) {
  return getStorageObjectPathFromPublicUrl(fileUrl, STOREFRONT_BANNERS_BUCKET);
}
