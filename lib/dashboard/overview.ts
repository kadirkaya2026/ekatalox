import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Genel Bakış ek kartları (kullanıcı isteği, 22 Eyl 2026): katalog sağlığı
// (stok dışı / görselsiz / fiyatsız) ve bildirim abonesi sayısı. Sipariş
// takibi (bekleyen, veresiye) BİLİNÇLİ olarak yok — toptancı siparişi
// WhatsApp'a gider, ödeme/sevkiyat takibi bizde değil.

export interface CatalogQuality {
  outOfStock: number;
  noImage: number;
  noPrice: number;
}

const EMPTY_QUALITY: CatalogQuality = { outOfStock: 0, noImage: 0, noPrice: 0 };

/** tenant_catalog_quality RPC (0128). RPC yoksa/hata verirse sıfırlar döner, kart gizlenir. */
export async function getTenantCatalogQuality(tenantId: string): Promise<CatalogQuality> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return EMPTY_QUALITY;
  const { data, error } = await supabase.rpc("tenant_catalog_quality", { p_tenant_id: tenantId });
  if (error || !data || typeof data !== "object") return EMPTY_QUALITY;
  const row = data as Record<string, unknown>;
  return {
    outOfStock: Number(row.out_of_stock) || 0,
    noImage: Number(row.no_image) || 0,
    noPrice: Number(row.no_price) || 0,
  };
}

/** Kampanyalar kartından bildirim izni veren kişi sayısı (kind='campaign'). */
export async function getTenantPushSubscriberCount(tenantId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("kind", "campaign");
  return error ? 0 : (count ?? 0);
}
