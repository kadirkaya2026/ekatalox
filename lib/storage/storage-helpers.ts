export const STORE_ASSETS_BUCKET = "product-images";

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

export function getStorageObjectPathFromPublicUrl(
  fileUrl: string | null,
  bucketName: string,
) {
  if (!fileUrl) {
    return null;
  }

  try {
    const url = new URL(fileUrl);
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}