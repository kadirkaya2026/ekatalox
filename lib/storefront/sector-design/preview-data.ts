import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantPriceLists } from "@/lib/data";
import type { PriceList } from "@/lib/types";

// Preview must not create default price lists or mutate tenant settings.
export async function getPreviewPriceLists(tenantId: string): Promise<PriceList[]> {
  const db = createSupabaseAdminClient();
  if (!db) return getTenantPriceLists(tenantId);
  const { data, error } = await db.from("price_lists").select("*").eq("tenant_id", tenantId).order("sort_order");
  if (error) throw new Error("Fiyat listeleri yüklenemedi.");
  return data ?? [];
}
