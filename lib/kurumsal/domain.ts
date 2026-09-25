import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import { normalizeCustomDomain, validateCustomDomainValue } from "@/lib/validators/custom-domain";

// Kurumsal site alan adı (tenants.kurumsal_domain, bkz. 0134). Kurumsal site
// yalnız tenant'ın KENDİ kök alan adında yayınlanır (ör. lucatech.com.tr);
// katalog/sipariş ekranı custom_domain ya da {sub}.ekatalox.com'da kalır.
// Alan adını tenant kendisi bağlar (Ayarlar → Kurumsal Site; Vercel'e
// ekleme lib/vercel/domains.ts). Değer normalize
// saklanır: küçük harf, şema/yol/port yok, baştaki "www." yok.
// İstemci + sunucu ortak (veri çekmez).

export function normalizeKurumsalDomain(value: string | null | undefined): string | null {
  return normalizeCustomDomain(value ?? "");
}

/** Biçim + platform alan adı kontrolü (özel alan adıyla aynı kurallar). */
export function validateKurumsalDomain(value: string | null | undefined) {
  const result = validateCustomDomainValue(value);
  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error.replace("Örn: katalog.firmaniz.com", "Örn: firmaniz.com"),
    };
  }
  return result;
}

/** https://alanadi — kurumsal sitenin kök adresi; alan adı yoksa null. */
export function buildKurumsalOrigin(kurumsalDomain: string | null | undefined) {
  const domain = normalizeKurumsalDomain(kurumsalDomain);
  return domain ? `https://${domain}` : null;
}

/** Katalog/sipariş ekranının adresi: özel alan adı varsa o, yoksa {sub}.{kök}. */
export function buildCatalogOrigin(
  tenant: { subdomain: string; custom_domain?: string | null },
  rootDomain: string,
) {
  return tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${rootDomain}`;
}

/**
 * Türetilmiş yayın durumu (panel, sihirbaz ve Genel Bakış aynı etiketi kullanır):
 *   draft    → is_published=false
 *   platform → is_published=true, alan adı yok: site {katalog adresi}/kurumsal'da
 *   domain   → is_published=true + kendi alan adı bağlı: site alan adının kökünde
 */
export type KurumsalPublishState = "draft" | "platform" | "domain";

export function getKurumsalPublishState(
  isPublished: boolean,
  kurumsalDomain: string | null | undefined,
): KurumsalPublishState {
  if (!isPublished) return "draft";
  return kurumsalDomain?.trim() ? "domain" : "platform";
}

export const KURUMSAL_PUBLISH_STATE_LABELS: Record<KurumsalPublishState, string> = {
  draft: "Taslak",
  platform: "Yayında (eKatalox adresi)",
  domain: "Yayında (kendi alan adı)",
};

/** Kurumsal site yolu: alan adı modunda "", platform (katalog) adresinde "/kurumsal". */
export function getKurumsalBasePath(kurumsalDomain: string | null | undefined): "" | "/kurumsal" {
  return kurumsalDomain?.trim() ? "" : "/kurumsal";
}

/** Sitenin ana sayfa adresi (alan adı ya da {katalog}/kurumsal). */
export function buildKurumsalHomeUrl(
  tenant: { subdomain: string; custom_domain?: string | null; kurumsal_domain?: string | null },
  rootDomain: string,
) {
  return buildKurumsalOrigin(tenant.kurumsal_domain) ?? `${buildCatalogOrigin(tenant, rootDomain)}/kurumsal`;
}

/** Alt yolu site tabanına göre kurar: "/"→ taban ya da "/", "/kategori/x" → taban+yol. */
export function kurumsalPath(basePath: "" | "/kurumsal", path: string) {
  if (path === "/" || path === "") return basePath || "/";
  if (path.startsWith("#")) return `${basePath || "/"}${path}`;
  return `${basePath}${path}`;
}

/** Kurumsal site paketi kapsıyor mu? (Deneme süresindeki üst paket de sayılır: plan alanı zaten o pakettir.) */
export function hasKurumsalSiteAccess(tenant: { plan?: TenantPlan | null } | null | undefined) {
  return hasPlanFeature(tenant?.plan ?? "baslangic", "kurumsal_site");
}
