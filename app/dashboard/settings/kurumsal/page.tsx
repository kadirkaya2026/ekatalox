import { Header } from "@/components/dashboard/header";
import { KurumsalSettingsPanel } from "@/components/dashboard/kurumsal-settings-panel";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { buildPackageUpgradeHref, getPlanLabel, PACKAGE_UPGRADE_PHONE } from "@/lib/billing/plans";
import { buildCatalogOrigin, buildKurumsalHomeUrl, hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { getPendingDomainRequest } from "@/lib/kurumsal/domain-requests";
import { resolveKurumsalAccent, resolveKurumsalHero } from "@/lib/kurumsal/format";
import { buildKurumsalContact } from "@/lib/kurumsal/page-context";
import { defaultKurumsalContent } from "@/lib/kurumsal/schema";
import { getGateBranding } from "@/lib/storefront/gate-branding";
import { getKurumsalSite } from "@/lib/storefront/kurumsal-content";
import { getKurumsalDataCached } from "@/lib/storefront/kurumsal-data";
import { isWhiteLabelStorefront } from "@/lib/storefront/white-label";

// Ayarlar → Kurumsal Site. Sihirbaz önizlemesi için katalog verisi
// (kategoriler/öne çıkanlar) ve hero görsel seçenekleri burada hazırlanır.
export default async function KurumsalSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sihirbaz?: string }>;
}) {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const { sihirbaz } = await searchParams;
  const entitled = hasKurumsalSiteAccess(tenant);
  const domainRequestHref = `https://wa.me/${PACKAGE_UPGRADE_PHONE}?text=${encodeURIComponent(
    `Merhaba, kurumsal sitem için alan adı almak istiyorum. Firma: ${tenant.company_name}`,
  )}`;
  const [settings, site, data, pendingRequest] = await Promise.all([
    getTenantStorefrontSettings(tenant.id),
    getKurumsalSite(tenant.id),
    getKurumsalDataCached(tenant.id),
    entitled ? getPendingDomainRequest(tenant.id) : null,
  ]);
  const branding = getGateBranding(tenant.subdomain);

  const bannerImages = [...(settings.banner_items ?? []), ...(settings.hero_cluster_items ?? [])].map(
    (item) => item.image_url,
  );
  const heroOptions = [
    ...new Set(
      [
        site?.content.hero_image_url,
        branding?.backgroundImage,
        settings.hero_image_url,
        ...bannerImages,
        ...data.categories.map((category) => category.imageUrl),
        ...data.featured.map((product) => product.imageUrl),
      ].filter((url): url is string => Boolean(url)),
    ),
  ].slice(0, 19);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Kurumsal Site"
        title="Kurumsal Site"
        description="Şifre sormayan, Google'da çıkan tanıtım sayfanızı sihirbazla birkaç dakikada hazırlayın; bayi adaylarınız sizi bulsun, başvuru formunu doldursun."
      />
      <KurumsalSettingsPanel
        entitled={entitled}
        autoOpen={sihirbaz === "1"}
        upgradeHref={buildPackageUpgradeHref(tenant.company_name, "kurumsal_site")}
        planName={getPlanLabel(tenant.plan ?? "baslangic")}
        initialDomain={tenant.kurumsal_domain ?? null}
        initialRequest={pendingRequest}
        domainRequestHref={domainRequestHref}
        initialSite={site}
        defaults={defaultKurumsalContent(tenant, settings)}
        ctx={{
          tenantName: tenant.company_name,
          firma: tenant.company_name?.trim() || settings.storefront_title?.trim() || "",
          subdomain: tenant.subdomain,
          logoUrl: settings.logo_url,
          wordmark: branding?.wordmark ?? null,
          fallbackAccent: resolveKurumsalAccent({
            gateAccent: branding?.accentColor,
            brandColor: settings.brand_primary_color,
          }),
          fallbackHero: resolveKurumsalHero({
            gateBackground: branding?.backgroundImage,
            settingsHero: settings.hero_image_url,
            bannerImages: (settings.banner_items ?? []).map((item) => item.image_url),
          }),
          heroOptions,
          contact: buildKurumsalContact(tenant, settings),
          data,
          isWhiteLabel: isWhiteLabelStorefront(tenant),
          publicUrl: buildKurumsalHomeUrl(tenant, appEnv.rootDomain),
          catalogUrl: buildCatalogOrigin(tenant, appEnv.rootDomain),
        }}
      />
    </div>
  );
}
