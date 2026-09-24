import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseKurumsalContent, type KurumsalSiteRecord } from "@/lib/kurumsal/schema";

// Kurumsal site (/kurumsal) içeriği: tenant_kurumsal_sites tablosundan
// (panelde "Ayarlar → Kurumsal Site" sihirbazıyla doldurulur, bkz. 0133).
// İçerik şeması lib/kurumsal/schema.ts; geçersiz kayıt null sayılır.

type KurumsalSiteRow = {
  is_published: boolean;
  content: unknown;
  published_at: string | null;
  updated_at: string | null;
};

/** Önbelleksiz okuma — panel API'si ve başvuru rotası için. */
export async function getKurumsalSiteRow(tenantId: string): Promise<KurumsalSiteRow | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tenant_kurumsal_sites")
    .select("is_published, content, published_at, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    console.error("[kurumsal] site okunamadı:", error.message);
    return null;
  }

  return (data as KurumsalSiteRow | null) ?? null;
}

function toRecord(row: KurumsalSiteRow | null): KurumsalSiteRecord | null {
  if (!row) return null;
  const content = parseKurumsalContent(row.content);
  if (!content) return null;
  return {
    is_published: Boolean(row.is_published),
    content,
    published_at: row.published_at,
    updated_at: row.updated_at,
  };
}

/** Önbelleksiz, doğrulanmış kayıt (içerik geçersizse null). */
export async function getKurumsalSite(tenantId: string): Promise<KurumsalSiteRecord | null> {
  return toRecord(await getKurumsalSiteRow(tenantId));
}

/**
 * Vitrin (ISR) sayfaları için: unstable_cache + storefront_{tenantId} tag'i.
 * Admin client no-store fetch yapar; sarmalanmazsa statik sayfa dinamiğe
 * düşer (app-static-to-dynamic 500). Panelden kaydedilince
 * revalidateStorefrontCache tag'i tazeler.
 */
export function getKurumsalSiteCached(tenantId: string): Promise<KurumsalSiteRecord | null> {
  return unstable_cache(async () => toRecord(await getKurumsalSiteRow(tenantId)), ["kurumsal-site", tenantId], {
    revalidate: 300,
    tags: [`storefront_${tenantId}`],
  })();
}
