import type { SupabaseClient } from "@supabase/supabase-js";
import { getEffectiveProductLimit } from "@/lib/billing/plans";
import type { TenantPlan } from "@/lib/billing/plans";

// Paket limiti üstündeki ürünleri vitrinden gizler (0151). Ürünler silinmez:
// en eski `limit` ürün görünür kalır, sonradan eklenenler is_over_limit=true
// olur ve yalnız yönetim panelinde listelenir. Paket değişince (düşürme,
// yükseltme, ödeme onayı, deneme) yeniden hesaplanır; limit yeterliyse hepsi açılır.
export async function applyProductVisibilityLimit(
  supabase: SupabaseClient,
  tenantId: string,
  plan: string,
  productLimitAddon = 0,
): Promise<{ hidden: number; visible: number }> {
  const limit = getEffectiveProductLimit(plan as TenantPlan, productLimitAddon);
  const { data, error } = await supabase
    .from("products")
    .select("id, is_over_limit")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error || !data) return { hidden: 0, visible: 0 };

  const rows = data as { id: string; is_over_limit: boolean }[];
  const toShow = rows.slice(0, limit).filter((r) => r.is_over_limit).map((r) => r.id);
  const toHide = rows.slice(limit).filter((r) => !r.is_over_limit).map((r) => r.id);
  for (const [ids, value] of [[toShow, false], [toHide, true]] as const) {
    for (let i = 0; i < ids.length; i += 500) {
      await supabase.from("products").update({ is_over_limit: value }).in("id", ids.slice(i, i + 500));
    }
  }
  return { hidden: Math.max(0, rows.length - limit), visible: Math.min(rows.length, limit) };
}
