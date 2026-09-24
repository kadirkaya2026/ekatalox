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

/** Kurumsal site paketi kapsıyor mu? (Deneme süresindeki üst paket de sayılır: plan alanı zaten o pakettir.) */
export function hasKurumsalSiteAccess(tenant: { plan?: TenantPlan | null } | null | undefined) {
  return hasPlanFeature(tenant?.plan ?? "baslangic", "kurumsal_site");
}
