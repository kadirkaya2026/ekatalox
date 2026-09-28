import type { SupabaseClient } from "@supabase/supabase-js";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage/product-images";

// Ürün görseli dosyası ancak (1) silen tenant'ın kendi klasöründeyse ve
// (2) başka bir ürün / ana katalog satırı aynı dosyayı kullanmıyorsa silinir.
// 28 Eyl 2026 denetimi: katalogdan içe aktarılan ürünler başka tenant'ın
// klasöründeki dosyaya işaret ediyordu; silince sahibin görselleri de gidiyordu.
const IN_CHUNK = 100;

export async function filterRemovableProductImagePaths(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    urls: Array<string | null | undefined>;
    /** Bu ürünlerin referansları sayılmaz (silinen / görseli değişen ürünler). */
    excludeProductIds?: Iterable<string>;
    /** true: aynı tenant'ın ürünlerinin referansları sayılmaz (tenant tümden siliniyor). */
    ignoreOwnTenantReferences?: boolean;
  },
): Promise<string[]> {
  const ownPrefix = `${params.tenantId}/`;
  const candidates = new Map<string, string>(); // url → path
  for (const url of params.urls) {
    if (!url) continue;
    const path = getStorageObjectPathFromPublicUrl(url, PRODUCT_IMAGES_BUCKET);
    if (path && path.startsWith(ownPrefix)) candidates.set(url, path);
  }
  if (!candidates.size) return [];

  const excluded = new Set(params.excludeProductIds ?? []);
  const referenced = new Set<string>();
  const urls = [...candidates.keys()];

  for (let i = 0; i < urls.length; i += IN_CHUNK) {
    const chunk = urls.slice(i, i + IN_CHUNK);
    const [p1, p2, p3, catalog] = await Promise.all([
      supabase.from("products").select("id, tenant_id, image_url").in("image_url", chunk),
      supabase.from("products").select("id, tenant_id, image_url_2").in("image_url_2", chunk),
      supabase.from("products").select("id, tenant_id, image_url_3").in("image_url_3", chunk),
      supabase.from("market_catalog_products").select("image_url").in("image_url", chunk),
    ]);
    // Sorgu hatasında güvenli taraf: hiçbirini silme.
    if (p1.error || p2.error || p3.error || catalog.error) return [];

    const productRefs = [
      ...((p1.data ?? []) as Array<{ id: string; tenant_id: string; image_url: string }>).map((r) => ({ ...r, url: r.image_url })),
      ...((p2.data ?? []) as Array<{ id: string; tenant_id: string; image_url_2: string }>).map((r) => ({ ...r, url: r.image_url_2 })),
      ...((p3.data ?? []) as Array<{ id: string; tenant_id: string; image_url_3: string }>).map((r) => ({ ...r, url: r.image_url_3 })),
    ];
    for (const ref of productRefs) {
      if (excluded.has(ref.id)) continue;
      if (params.ignoreOwnTenantReferences && ref.tenant_id === params.tenantId) continue;
      referenced.add(ref.url);
    }
    for (const row of (catalog.data ?? []) as Array<{ image_url: string }>) {
      referenced.add(row.image_url);
    }
  }

  return [...new Set(urls.filter((url) => !referenced.has(url)).map((url) => candidates.get(url)!))];
}
