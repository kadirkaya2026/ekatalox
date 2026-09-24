import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { isTrialExpired } from "@/lib/billing/trial";
import { appEnv } from "@/lib/env";
import { buildCatalogOrigin, buildKurumsalOrigin, hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { resolveKurumsalAccent, resolveKurumsalHero } from "@/lib/kurumsal/format";
import type { KurumsalContent } from "@/lib/kurumsal/schema";
import { getGateBranding } from "@/lib/storefront/gate-branding";
import { getKurumsalSiteCached } from "@/lib/storefront/kurumsal-content";
import { isWhiteLabelStorefront } from "@/lib/storefront/white-label";
import type { Tenant, TenantStorefrontSettings } from "@/lib/types";
import type { KurumsalContact } from "@/components/kurumsal/kurumsal-view";

// /kurumsal, /kurumsal/kategori/[id] ve /kurumsal/urun/[id] sayfalarının
// ortak bağlamı: tenant + ayarlar + yayındaki içerik + marka çözümlemesi.
// Tüm okumalar önbellekli (getStorefrontTenantCached, getTenantStorefrontSettings,
// getKurumsalSiteCached) — ISR sayfaları dinamiğe düşmez.
// null: tenant yok / askıda / deneme bitmiş / paket kapsamıyor / kurumsal
// alan adı bağlı değil / kurumsal site yok ya da yayında değil.

export interface KurumsalPageContext {
  tenant: Tenant;
  settings: TenantStorefrontSettings;
  content: KurumsalContent;
  accent: string;
  heroImage: string | null;
  wordmark: string | null;
  contact: KurumsalContact;
  isWhiteLabel: boolean;
  /** https://{kurumsal_domain} — canonical/OG/sitemap adresleri */
  kurumsalOrigin: string;
  /** Katalog/sipariş ekranı ("Bayi Girişi") */
  catalogUrl: string;
}

export async function getKurumsalPageContext(subdomain: string): Promise<KurumsalPageContext | null> {
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status === "suspended" || isTrialExpired(tenant)) return null;
  // Yalnız en üst paket + kendi alan adı bağlı tenant'larda kurumsal site var.
  const kurumsalOrigin = buildKurumsalOrigin(tenant.kurumsal_domain);
  if (!hasKurumsalSiteAccess(tenant) || !kurumsalOrigin) return null;

  const [settings, site] = await Promise.all([
    getTenantStorefrontSettings(tenant.id),
    getKurumsalSiteCached(tenant.id),
  ]);
  if (!site || !site.is_published) return null;

  const branding = getGateBranding(subdomain);
  const content = site.content;

  return {
    tenant,
    settings,
    content,
    accent: resolveKurumsalAccent({
      contentAccent: content.accent_color,
      gateAccent: branding?.accentColor,
      brandColor: settings.brand_primary_color,
    }),
    heroImage: resolveKurumsalHero({
      contentHero: content.hero_image_url,
      gateBackground: branding?.backgroundImage,
      settingsHero: settings.hero_image_url,
      bannerImages: (settings.banner_items ?? []).map((item) => item.image_url),
    }),
    wordmark: branding?.wordmark ?? null,
    contact: buildKurumsalContact(tenant, settings),
    isWhiteLabel: isWhiteLabelStorefront(tenant),
    kurumsalOrigin,
    catalogUrl: buildCatalogOrigin(tenant, appEnv.rootDomain),
  };
}

export function buildKurumsalContact(
  tenant: Pick<Tenant, "whatsapp_number" | "contact_email">,
  settings: Pick<TenantStorefrontSettings, "footer_phone" | "footer_email" | "footer_location" | "footer_whatsapp">,
): KurumsalContact {
  return {
    phone: settings.footer_phone ?? null,
    email: settings.footer_email ?? tenant.contact_email ?? null,
    address: settings.footer_location ?? null,
    whatsapp: tenant.whatsapp_number || settings.footer_whatsapp || null,
  };
}
