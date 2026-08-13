// ISR: bu sayfa çerez okumaz; proxy.ts sadece yaş doğrulama çerezinin
// varlığına bakıp buraya rewrite eder. Tenant ayarı değişince
// revalidateStorefrontCache bu yolu da tazeler.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AgeVerificationGate } from "@/components/storefront/age-verification-gate";
import { StoreClosedNotice } from "@/components/storefront/store-closed-notice";
import { StorefrontSuspendedNotice } from "@/components/storefront/storefront-suspended-notice";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { getAppearanceFromSettings } from "@/lib/storefront/theme-context";
import { isTrialExpired } from "@/lib/billing/trial";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/yas-dogrulama">,
): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);

  if (!tenant) {
    return {};
  }

  const settings = await getTenantStorefrontSettings(tenant.id);
  const title =
    settings.site_tab_title ?? settings.storefront_title ?? tenant.company_name;

  return {
    title,
    icons: settings.site_favicon_url
      ? { icon: settings.site_favicon_url }
      : undefined,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function StorefrontAgeGatePage(
  props: PageProps<"/store/[subdomain]/yas-dogrulama">,
) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);

  if (!tenant) {
    notFound();
  }

  if (tenant.status === "suspended") {
    const settings = await getTenantStorefrontSettings(tenant.id);

    return (
      <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
        <StorefrontSuspendedNotice appearance={getAppearanceFromSettings(settings)} />
      </StorefrontLocaleProvider>
    );
  }

  if (isTrialExpired(tenant)) {
    const settings = await getTenantStorefrontSettings(tenant.id);

    return (
      <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
        <StoreClosedNotice appearance={getAppearanceFromSettings(settings)} />
      </StorefrontLocaleProvider>
    );
  }

  // Ayar kapatıldıysa (business_type değişti veya toggle kapatıldı) ama
  // çerez henüz set edilmediyse buraya düşen ziyaretçi doğrudan içeriğe
  // geri gönderilir; proxy.ts bir sonraki istekte zaten bu sayfayı devre
  // dışı bırakacaktır.
  if (tenant.business_type !== "market" || !tenant.age_verification_required) {
    redirect("/");
  }

  const settings = await getTenantStorefrontSettings(tenant.id);

  return (
    <StorefrontPageShell storefrontSettings={settings} subdomain={subdomain}>
      <AgeVerificationGate
        subdomain={subdomain}
        companyName={tenant.company_name}
        themeKey={settings.theme_key}
        isThemeToggleVisible={settings.is_theme_toggle_visible}
      />
    </StorefrontPageShell>
  );
}
