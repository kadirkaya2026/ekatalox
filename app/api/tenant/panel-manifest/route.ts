import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantStorefrontSettings } from "@/lib/data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Panelin "Ana Ekrana Ekle" manifesti: bayinin adı ve logosuyla. Tarayıcı
// manifesti çerezsiz çeker (aynı origin'de bile), bu yüzden oturum yerine
// tenant id ile çalışır; döndürdüğü bilgi (ad, logo) vitrinde zaten herkese açık.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("tenant") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Geçersiz." }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const [{ data: tenant }, settings] = await Promise.all([
    supabase.from("tenants").select("company_name").eq("id", id).maybeSingle(),
    getTenantStorefrontSettings(id),
  ]);
  if (!tenant) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

  const name = settings.storefront_title?.trim() || tenant.company_name;
  const icon = settings.logo_url || settings.site_favicon_url || "/ekatalox-logo-v2.png";
  return NextResponse.json(
    {
      name: `${name} Panel`,
      short_name: name.length > 12 ? name.slice(0, 12) : name,
      start_url: "/dashboard/siparisler",
      scope: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: settings.brand_primary_color || "#0f172a",
      icons: [
        { src: icon, sizes: "192x192", type: "image/png" },
        { src: icon, sizes: "512x512", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } },
  );
}
