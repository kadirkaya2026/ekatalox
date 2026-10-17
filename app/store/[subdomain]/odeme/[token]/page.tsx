// Online ödeme sayfası (0185). Sipariş sepette "Online Öde" ile kaydedilir,
// müşteri buraya gelir; kart bilgisi mağazanın sağlayıcısının (iyzico / PayTR /
// Paynet) kendi sayfasında girilir. Girişsiz: URL'deki takip token'ı yetkidir.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { getOrderByTrackingToken } from "@/lib/orders/data";
import { OnlinePaymentView } from "@/components/storefront/online-payment-view";
import { buildStorefrontIcons, buildStorefrontTitle } from "@/lib/storefront/white-label";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PaymentPageProps = {
  params: Promise<{ subdomain: string; token: string }>;
  searchParams?: Promise<{ sonuc?: string }>;
};

export async function generateMetadata(props: PaymentPageProps): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  return {
    title: buildStorefrontTitle("Ödeme", tenant),
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    robots: { index: false, follow: false },
  };
}

export default async function OnlinePaymentPage(props: PaymentPageProps) {
  const { subdomain, token } = await props.params;
  if (!UUID.test(token)) notFound();

  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active") notFound();

  const result = await getOrderByTrackingToken(token);
  if (!result || result.order.tenant_id !== tenant.id || result.order.payment_method !== "online") notFound();

  const settings = await getTenantStorefrontSettings(tenant.id);
  const storeName = settings.storefront_title?.trim() || tenant.company_name;
  const search = (await props.searchParams) ?? {};
  const { order } = result;

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-900 sm:py-10">
      <div className="mx-auto max-w-xl">
        <header className="mb-5 flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={storeName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="truncate text-lg font-bold">{storeName}</span>
            )}
          </Link>
          <Link href="/" className="shrink-0 text-sm font-semibold text-slate-600 underline underline-offset-4">
            Mağazaya dön
          </Link>
        </header>

        <OnlinePaymentView
          subdomain={subdomain}
          token={token}
          storeName={storeName}
          returnedFromProvider={search.sonuc === "1" || search.sonuc === "0"}
          order={{
            orderNo: order.order_no ?? null,
            totalAmount: Number(order.total_amount),
            itemCount: order.item_count,
            customerName: order.customer_name,
            paymentStatus: order.payment_status ?? "awaiting",
            cancelled: order.status === "cancelled",
          }}
        />

        <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500" aria-label="Yasal sayfalar">
          <Link href="/yasal/on-bilgilendirme-formu" className="underline underline-offset-4">
            Ön Bilgilendirme Formu
          </Link>
          <Link href="/yasal/mesafeli-satis-sozlesmesi" className="underline underline-offset-4">
            Mesafeli Satış Sözleşmesi
          </Link>
          <Link href="/yasal/iptal-iade-kosullari" className="underline underline-offset-4">
            İptal ve İade
          </Link>
          <Link href="/yasal/satici-bilgileri" className="underline underline-offset-4">
            Satıcı Bilgileri
          </Link>
        </nav>
      </div>
    </main>
  );
}
