// Müşteri sipariş takip sayfası. Girişsiz: URL'deki token yetkidir
// (uuid v4, WhatsApp mesajıyla yalnız müşteriye gidiyor). Her istekte
// veritabanından okunur; durum canlı olmalı.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTrackingView } from "@/components/storefront/order-tracking-view";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { getOrderByTrackingToken } from "@/lib/orders/data";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { buildStorefrontIcons, buildStorefrontTitle } from "@/lib/storefront/white-label";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TrackingPageProps = { params: Promise<{ subdomain: string; token: string }> };

export async function generateMetadata(props: TrackingPageProps): Promise<Metadata> {
  const { subdomain, token } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  const base = buildStorefrontIcons(settings.site_favicon_url, tenant);
  // iOS ana ekran ikonu apple-touch-icon'dan gelir (manifest'ten değil):
  // bayinin logosu, yoksa favicon'u.
  const appleIcon = settings.logo_url || settings.site_favicon_url || null;
  return {
    title: buildStorefrontTitle("Sipariş Takip", tenant),
    icons: appleIcon ? { ...base, apple: appleIcon } : base,
    appleWebApp: { capable: true, title: settings.storefront_title?.trim() || tenant.company_name, statusBarStyle: "default" },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    // Sipariş özel manifest: "Ana Ekrana Ekle" bu sayfaya, bayinin adı/logosuyla açılır.
    manifest: UUID.test(token) ? `/api/storefront/tracking-manifest?token=${token}` : undefined,
  };
}

export default async function OrderTrackingPage(props: TrackingPageProps) {
  const { subdomain, token } = await props.params;
  if (!UUID.test(token)) notFound();

  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active") notFound();

  const result = await getOrderByTrackingToken(token);
  // Token başka bir bayinin siparişine aitse bu host'ta gösterilmez.
  if (!result || result.order.tenant_id !== tenant.id) notFound();

  const settings = await getTenantStorefrontSettings(tenant.id);
  const { order, events } = result;

  return (
    <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
      <OrderTrackingView
        token={token}
        tenantName={settings.storefront_title?.trim() || tenant.company_name}
        whatsappNumber={tenant.whatsapp_number}
        isTekel={Boolean(tenant.is_tekel)}
        appearance={getAppearanceFromSettings(settings)}
        initial={{
          orderNumber: order.order_number,
          createdAt: order.created_at,
          status: order.status,
          statusUpdatedAt: order.status_updated_at,
          cancelReason: order.cancel_reason,
          currency: order.currency,
          totalAmount: order.total_amount,
          items: order.items.map((item) => ({
            name: item.product_name,
            variant: item.variant_name ?? null,
            quantity: item.quantity,
            unit: item.sales_unit ?? null,
            price: item.price,
          })),
          events: events.map((ev) => ({ status: ev.to_status, at: ev.created_at })),
        }}
      />
    </StorefrontLocaleProvider>
  );
}
