// Panel görsel yüklemeleri (banner, kategori, büyük banner + yan kutucuk)
// eskiden piksel piksel sabit ölçü istiyordu (ör. tam 1200x400); müşteriler
// görsel ölçüsüyle uğraşıp takılıyordu (15 Eki 2026). Artık her boyut kabul
// edilir: tarayıcıda hedef orana ortadan kırpılır, en fazla hedefin 2 katı
// (ör. 2400x800, keskin ekranlarda net) boyuta indirilir ve sıkıştırılır.
// Sunucu yalnız oranı ve son dosya boyutunu denetler.

export interface PreparedUploadImage {
  file: File;
  width: number;
  height: number;
  /** Oran tutmadığı için kenarlardan kırpıldı. */
  cropped: boolean;
  /** Kaynak hedef ölçüden küçük; vitrinde biraz bulanık görünebilir. */
  small: boolean;
}

// Bu kadarlık oran farkı kırpılmadan kabul edilir (gözle fark edilmez).
const RATIO_TOLERANCE = 0.02;
const MAX_SCALE = 2;
// Kullanıcının seçebileceği ham dosya üst sınırı (telefon fotoğrafı dahil).
export const maxSourceImageBytes = 25 * 1024 * 1024;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Görsel okunamadı. PNG, JPEG veya WEBP bir dosya seçin."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareUploadImage(
  file: File,
  target: { width: number; height: number },
  maxBytes: number,
): Promise<PreparedUploadImage> {
  if (file.size > maxSourceImageBytes) {
    throw new Error("Görsel dosyası çok büyük (en fazla 25MB).");
  }

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("Görselin çözünürlüğü okunamadı.");
  }

  const targetRatio = target.width / target.height;
  const sourceRatio = sourceWidth / sourceHeight;
  const cropped = Math.abs(sourceRatio - targetRatio) / targetRatio > RATIO_TOLERANCE;

  // Ortadan kırpma: fazla olan kenar eşit kesilir.
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (cropped) {
    if (sourceRatio > targetRatio) cropWidth = Math.round(sourceHeight * targetRatio);
    else cropHeight = Math.round(sourceWidth / targetRatio);
  }
  const cropX = Math.round((sourceWidth - cropWidth) / 2);
  const cropY = Math.round((sourceHeight - cropHeight) / 2);

  // Büyütme yok; en fazla hedefin 2 katı. Çıktı oranı her zaman tam hedef oran.
  const outWidth = Math.max(1, Math.min(cropWidth, target.width * MAX_SCALE));
  const outHeight = Math.max(1, Math.round(outWidth / targetRatio));
  const small = cropWidth < target.width;

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Görsel hazırlanamadı.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, outWidth, outHeight);

  // WEBP (şeffaflık korunur); desteklemeyen tarayıcıda JPEG (beyaz zemin).
  let blob: Blob | null = null;
  let type = "image/webp";
  for (const quality of [0.9, 0.82, 0.72, 0.6]) {
    blob = await canvasToBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      blob = null;
      break;
    }
    if (blob.size <= maxBytes) break;
  }
  if (!blob || blob.size > maxBytes) {
    type = "image/jpeg";
    const flat = document.createElement("canvas");
    flat.width = outWidth;
    flat.height = outHeight;
    const flatContext = flat.getContext("2d");
    if (!flatContext) throw new Error("Görsel hazırlanamadı.");
    flatContext.fillStyle = "#ffffff";
    flatContext.fillRect(0, 0, outWidth, outHeight);
    flatContext.drawImage(canvas, 0, 0);
    for (const quality of [0.9, 0.82, 0.72, 0.6, 0.5]) {
      blob = await canvasToBlob(flat, "image/jpeg", quality);
      if (blob && blob.size <= maxBytes) break;
    }
  }
  if (!blob || blob.size > maxBytes) {
    throw new Error("Görsel yeterince küçültülemedi. Daha küçük bir görsel deneyin.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "gorsel";
  const extension = type === "image/webp" ? "webp" : "jpg";
  return {
    file: new File([blob], `${baseName}.${extension}`, { type }),
    width: outWidth,
    height: outHeight,
    cropped,
    small,
  };
}

/** Yükleme sonrası müşteriye gösterilecek kısa not (yoksa null). */
export function describePreparedImage(prepared: PreparedUploadImage): string | null {
  if (prepared.cropped && prepared.small) {
    return "Görsel orana uymadığı için kenarlardan kırpıldı; ayrıca küçük olduğu için biraz bulanık görünebilir.";
  }
  if (prepared.cropped) return "Görsel orana uymadığı için kenarlardan kırpıldı. Önizlemeyi kontrol edin.";
  if (prepared.small) return "Görsel küçük olduğu için vitrinde biraz bulanık görünebilir.";
  return null;
}

/** Sunucu: yüklemenin oranı hedefe yakın mı (istemci zaten tam orana kırpar). */
export function isAcceptableUploadRatio(
  dimensions: { width: number; height: number },
  target: { width: number; height: number },
) {
  const targetRatio = target.width / target.height;
  const ratio = dimensions.width / dimensions.height;
  return (
    Math.abs(ratio - targetRatio) / targetRatio <= 0.05 &&
    dimensions.width >= Math.round(target.width / 4) &&
    dimensions.width <= target.width * MAX_SCALE + 2
  );
}
