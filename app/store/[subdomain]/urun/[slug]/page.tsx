// Vitrin ürün sayfası: /urun/<model-kodu | id> (27 Eyl 2026). Ana sayfayla
// aynı ekran (StorefrontClient) ürün görünümünde açılır; sepet, üst bar ve
// sipariş akışı ortak. Şifre kapısı proxy + renderStorefrontHome'da; giriş
// sonrası PasswordGate aynı adrese döner. Ürün bulunamazsa 404.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import {
  generateStorefrontMetadata,
  renderStorefrontHome,
} from "@/components/storefront/storefront-home-page";
import { getStorefrontTenant } from "@/lib/data";

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/urun/[slug]">,
): Promise<Metadata> {
  const { subdomain, slug } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);
  // Başlıkta fiyat listesine bağlı veri yok; model kodu yeterli (ad için
  // çerez okunmadan ürün çekmek gerekmesin).
  const label = tenant ? decodeURIComponent(slug).toUpperCase() : null;
  return generateStorefrontMetadata({ params: Promise.resolve({ subdomain }) }, label);
}

export default async function StorefrontProductPage(props: PageProps<"/store/[subdomain]/urun/[slug]">) {
  const { subdomain, slug } = await props.params;
  const searchParams = ((await props.searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  return renderStorefrontHome({ subdomain, searchParams, productSlug: slug });
}
