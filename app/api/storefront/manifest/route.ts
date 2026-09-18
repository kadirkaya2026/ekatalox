import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";

// Vitrin ana sayfasının web manifest'i: iPhone'da "Ana Ekrana Ekle" bayinin
// adı ve logosuyla, adres çubuksuz (standalone) açılsın. Web Push iOS'ta
// yalnız bu modda çalıştığı için Kampanyalar panelindeki bildirim kartı
// müşteriyi buraya yönlendiriyor (components/storefront/campaign-push-card.tsx).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = (url.searchParams.get("subdomain") ?? "").trim().toLowerCase();
  const tenant = subdomain ? await getStorefrontTenant(subdomain) : null;
  if (!tenant) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

  const settings = await getTenantStorefrontSettings(tenant.id);
  const name = settings.storefront_title?.trim() || tenant.company_name;
  const icon = settings.logo_url || settings.site_favicon_url || "/ekatalox-logo-v2.png";

  return NextResponse.json(
    {
      name,
      short_name: name.length > 12 ? name.slice(0, 12) : name,
      start_url: "/?app=1",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: settings.brand_primary_color || "#111827",
      icons: [
        { src: icon, sizes: "192x192", type: "image/png" },
        { src: icon, sizes: "512x512", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } },
  );
}
