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
