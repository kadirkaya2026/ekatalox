import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "@/lib/types";

// Sipariş fişine ürün görseli (28 Eyl 2026, qoop isteği). Görsel adresi
// istemcinin sepetinden DEĞİL, veritabanındaki ürün kaydından alınır
// (sunucunun keyfi adres çekmesini önler). Küçük kare JPEG'e indirilir ki
// 50-100 kalemlik fişte PDF şişmesin.
const THUMB_PX = 120;
const FETCH_TIMEOUT_MS = 4000;
const MAX_ITEMS = 150;

async function toThumbDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;
    const input = Buffer.from(await response.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize(THUMB_PX, THUMB_PX, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 72 })
      .toBuffer();
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Sepet satırı indeksine göre küçük görsel (data URL); bulunamayan satır null. */
export async function loadReceiptItemImages(
  supabase: SupabaseClient,
  tenantId: string,
  items: CartItem[],
): Promise<Array<string | null>> {
  const productIds = [...new Set(items.slice(0, MAX_ITEMS).map((item) => item.product_id).filter(Boolean))];
  if (productIds.length === 0) return items.map(() => null);

  const { data: products } = await supabase
    .from("products")
    .select("id, image_url")
    .eq("tenant_id", tenantId)
    .in("id", productIds);
  const productImage = new Map((products ?? []).map((row) => [row.id as string, row.image_url as string | null]));
  const urlFor = (item: CartItem) => productImage.get(item.product_id) || null;

  const uniqueUrls = [...new Set(items.slice(0, MAX_ITEMS).map(urlFor).filter(Boolean))] as string[];
  const thumbs = new Map<string, string | null>();
  // Aynı anda en fazla 8 indirme.
  for (let i = 0; i < uniqueUrls.length; i += 8) {
    const batch = uniqueUrls.slice(i, i + 8);
    const results = await Promise.all(batch.map(toThumbDataUrl));
    batch.forEach((url, index) => thumbs.set(url, results[index]));
  }

  return items.map((item, index) => {
    if (index >= MAX_ITEMS) return null;
    const url = urlFor(item);
    return url ? thumbs.get(url) ?? null : null;
  });
}
