import { NextResponse } from "next/server";
import { getOrderByTrackingToken } from "@/lib/orders/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantStorefrontSettings } from "@/lib/data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Takip sayfasına özel web manifest: iPhone "Ana Ekrana Ekle" dediğinde
// uygulama adı BAYİNİN adı, ikonu bayinin logosu/favicon'u olsun ve
// açıldığında vitrin ana sayfası değil, bu siparişin takip sayfası gelsin.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!UUID.test(token)) return NextResponse.json({ error: "Geçersiz." }, { status: 400 });

  const result = await getOrderByTrackingToken(token);
  const supabase = createSupabaseAdminClient();
  if (!result || !supabase) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

  const [{ data: tenant }, settings] = await Promise.all([
    supabase.from("tenants").select("company_name").eq("id", result.order.tenant_id).maybeSingle(),
    getTenantStorefrontSettings(result.order.tenant_id),
  ]);
  const name = settings.storefront_title?.trim() || tenant?.company_name || "Sipariş Takip";
  const icon = settings.logo_url || settings.site_favicon_url || "/ekatalox-logo-v2.png";

  return NextResponse.json(
    {
      name,
      short_name: name.length > 12 ? name.slice(0, 12) : name,
      // ?app=1: ana ekrandan açılınca sayfa müşterinin EN SON siparişine yönlendirir
      // (bkz. siparis/[token]/page.tsx). Böylece ikon bir kez eklenir, hep güncel kalır.
      start_url: `/siparis/${token}?app=1`,
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
