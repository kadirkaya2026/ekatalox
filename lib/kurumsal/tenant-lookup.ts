import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/lib/types";

// Proxy için: kök alan adından (www'suz) kurumsal sitesi olan tenant'ı bulur.
// 0134 uygulanmadan önce kolon yoksa sorgu hata verir → null (site yok gibi
// davranılır, mevcut akış bozulmaz).
export async function getTenantByKurumsalDomain(domain: string): Promise<Tenant | null> {
  const normalized = domain.trim().toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
  // Yalnız geçerli ana makine adı; Host başlığındaki joker/garip karakterler sorguya girmesin.
  if (!normalized || !/^[a-z0-9.-]+$/.test(normalized)) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("kurumsal_domain", normalized)
    .maybeSingle();

  if (error) return null;
  return (data as Tenant | null) ?? null;
}

// Proxy için: tenant'ın kurumsal sitesi yayında mı? (katalog adresindeki
// eski /kurumsal yollarını kurumsal alan adına 301'lemeden önce bakılır)
export async function isKurumsalSitePublished(tenantId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("tenant_kurumsal_sites")
    .select("is_published")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return false;
  return Boolean((data as { is_published?: boolean } | null)?.is_published);
}
