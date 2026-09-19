// "Tek link" bildirim daveti: bayi müşterisine https://{mağaza}/bildirim atar.
// Android/masaüstü: ad + telefon → izin → bitti. iPhone: ad + telefon Safari'de
// sunucuya kaydedilir (push_invites), manifest start_url token'ı taşır; müşteri
// siteyi ana ekrana ekleyip simgeden açınca tek tuşla abone olur.
// proxy.ts bu yolu şifre/yaş/kota kapılarından önce buraya yazar; şifre kapısı
// gerekiyorsa sayfa kendisi gösterir (girişten sonra aynı adrese dönülür).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { PushInviteView } from "@/components/storefront/push-invite-view";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";
import { INVITE_TOKEN_RE } from "@/lib/push/invite";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { readStorefrontPriceList } from "@/lib/storefront/session";
import { buildStorefrontIcons, buildStorefrontTitle, isWhiteLabelStorefront } from "@/lib/storefront/white-label";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PushInvitePageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams?: Promise<{ t?: string; app?: string }>;
};

function readToken(raw: string | undefined) {
  return raw && INVITE_TOKEN_RE.test(raw) ? raw : null;
}

export async function generateMetadata(props: PushInvitePageProps): Promise<Metadata> {
  const { subdomain } = await props.params;
  const token = readToken((await props.searchParams)?.t);
  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  const base = buildStorefrontIcons(settings.site_favicon_url, tenant);
  const appleIcon = settings.logo_url || settings.site_favicon_url || null;
  const manifest = `/api/storefront/manifest?subdomain=${encodeURIComponent(subdomain)}${
    token ? `&start=${encodeURIComponent(`/bildirim?t=${token}`)}` : ""
  }`;
  return {
    title: buildStorefrontTitle("Bildirimler", tenant),
    icons: appleIcon ? { ...base, apple: appleIcon } : base,
    appleWebApp: { capable: true, title: settings.storefront_title?.trim() || tenant.company_name, statusBarStyle: "default" },
    manifest,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function PushInvitePage(props: PushInvitePageProps) {
  const { subdomain } = await props.params;
  const token = readToken((await props.searchParams)?.t);
  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant || tenant.status !== "active") notFound();
  const settings = await getTenantStorefrontSettings(tenant.id);

  const cookie = await readStorefrontPriceList(subdomain);
  const hasSession = Boolean(cookie && cookie.tenantId === tenant.id);

  let invite: { name: string; phone: string; subscribed: boolean } | null = null;
  const supabase = token ? createSupabaseAdminClient() : null;
  if (token && supabase) {
    const { data } = await supabase
      .from("push_invites")
      .select("subscriber_name, subscriber_phone, subscribed_at")
      .eq("tenant_id", tenant.id)
      .eq("token", token)
      .maybeSingle();
    if (data) invite = { name: data.subscriber_name, phone: data.subscriber_phone, subscribed: Boolean(data.subscribed_at) };
  }

  const locale = (
    <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale} pickupWording={Boolean(tenant.is_tekel)}>
      {tenant.is_password_protected && !hasSession && !invite ? (
        <StorefrontPageShell storefrontSettings={settings} subdomain={subdomain} hidePoweredBy={isWhiteLabelStorefront(tenant)}>
          <PasswordGate
            subdomain={subdomain}
            companyName={tenant.company_name}
            themeKey={settings.theme_key}
            isThemeToggleVisible={settings.is_theme_toggle_visible}
          />
        </StorefrontPageShell>
      ) : (
        <PushInviteView
          subdomain={subdomain}
          tenantName={settings.storefront_title?.trim() || tenant.company_name}
          logoUrl={settings.logo_url ?? null}
          appearance={getAppearanceFromSettings(settings)}
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
          token={invite ? token : null}
          invite={invite}
        />
      )}
    </StorefrontLocaleProvider>
  );
  return locale;
}
