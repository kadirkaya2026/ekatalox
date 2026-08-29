import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, StorefrontCoupon } from "@/lib/types";
import { getDescendantCategoryIds } from "@/lib/categories/tree";

const COUPON_SELECT = "id, kind, value, min_order_amount, currency, title, message, expires_at, single_use, status, category_ids";

// Kapsam kategorilerini alt kategorilerle genişletir; ad listesi seçilen
// üst kategorilerin adı (müşteriye "Atıştırmalık kategorisinde" diye yazılır).
export function expandCouponCategories(categoryIds: string[] | null | undefined, categories: Category[]) {
  if (!categoryIds?.length) return { ids: null as string[] | null, names: [] as string[] };
  const byId = new Map(categories.map((c) => [c.id, c]));
  const ids = new Set<string>();
  const names: string[] = [];
  for (const id of categoryIds) {
    const cat = byId.get(id);
    if (!cat) continue;
    names.push(cat.name);
    ids.add(id);
    for (const d of getDescendantCategoryIds(categories, id)) ids.add(d);
  }
  return { ids: [...ids], names };
}

// Telefona tanımlı, süresi geçmemiş, aktif kupon (en yenisi). Vitrin ve
// sipariş kaydı aynı fonksiyonu kullanır → istemci/sunucu tutarlı.
export async function findActiveCouponForPhone(
  supabase: SupabaseClient,
  tenantId: string,
  phone: string,
): Promise<StorefrontCoupon | null> {
  if (!phone) return null;
  const { data } = await supabase
    .from("customer_coupons")
    .select(COUPON_SELECT)
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  let ids: string[] | null = null;
  let names: string[] = [];
  if (Array.isArray(data.category_ids) && data.category_ids.length) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("tenant_id", tenantId);
    const expanded = expandCouponCategories(data.category_ids, (cats ?? []) as Category[]);
    ids = expanded.ids;
    names = expanded.names;
  }

  return {
    id: data.id,
    kind: data.kind,
    value: Number(data.value),
    min_order_amount: data.min_order_amount === null ? null : Number(data.min_order_amount),
    currency: data.currency,
    title: data.title,
    message: data.message ?? null,
    expires_at: data.expires_at ?? null,
    category_ids: ids,
    category_names: names,
  };
}
