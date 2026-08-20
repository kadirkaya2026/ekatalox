import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductSuggestion, ProductSuggestionWithTenant } from "@/lib/types";

export async function getTenantPendingSuggestionNotices(
  tenantId: string,
): Promise<ProductSuggestion[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("product_suggestions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .is("dismissed_at", null)
    .order("reviewed_at", { ascending: false });

  return (data as ProductSuggestion[] | null) ?? [];
}

// Menüdeki kırmızı bildirim rozeti için — onaylanmış ama tenant'ın henüz
// kapatmadığı öneri sayısı. Her dashboard sayfasında (layout) çalıştığı için
// satırlar çekilmiyor, sadece sayım yapılıyor.
export async function getTenantSuggestionNoticeCount(tenantId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from("product_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .is("dismissed_at", null);

  return count ?? 0;
}

// Ürünler sayfasındaki "Önerdiğim Ürünler" bölümü için — tenant'ın bugüne
// kadar önerdiği ürünler, en yeni en üstte. Süper admin bir öneriyi
// reddettiğinde tenant'a hiçbir iz kalmadan (sessizce) kaybolmalı
// (kullanıcı isteği, 19 Ağu 2026) — bu yüzden "rejected" durumundakiler
// burada hiç dönmüyor.
export async function getTenantAllSuggestions(tenantId: string): Promise<ProductSuggestion[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("product_suggestions")
    .select("*")
    .eq("tenant_id", tenantId)
    .neq("status", "rejected")
    .order("created_at", { ascending: false });

  return (data as ProductSuggestion[] | null) ?? [];
}

export async function getPendingProductSuggestions(): Promise<ProductSuggestionWithTenant[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data: suggestions } = await supabase
    .from("product_suggestions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (suggestions as ProductSuggestion[] | null) ?? [];
  if (!rows.length) {
    return [];
  }

  const tenantIds = [...new Set(rows.map((row) => row.tenant_id))];
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, company_name, subdomain")
    .in("id", tenantIds);

  const tenantById = new Map(
    (tenants ?? []).map((tenant) => [tenant.id as string, tenant as { company_name: string; subdomain: string }]),
  );

  return rows.map((row) => ({
    ...row,
    tenant_company_name: tenantById.get(row.tenant_id)?.company_name ?? "Bilinmeyen bayi",
    tenant_subdomain: tenantById.get(row.tenant_id)?.subdomain ?? "",
  }));
}
