import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestHost } from "@/lib/tenancy/request-host";
import { loadShareCardTenant, shareCardHtml } from "@/lib/storefront/share-card";

// Link önizleme sayfası (15 Eki 2026): proxy.ts WhatsApp vb. önizleme botlarını
// mağaza ana sayfası, ürün ve sipariş takip linklerinde şifre kapısından ÖNCE
// buraya yönlendirir. Eskiden kök layout'un eKatalox tanıtım kartı görünüyordu.
// Yalnız mağaza adı/logosu ve ürünün adı/resmi verilir; FİYAT YOK (şifre kapısı
// fiyatı korur, UA taklidiyle fiyat sızmasın).
export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await ctx.params;
  const storefront = await getStorefrontTenant(subdomain);
  const tenant = storefront ? await loadShareCardTenant(storefront.id) : null;
  if (!storefront || !tenant) return new NextResponse("Not Found", { status: 404 });

  const origin = `https://${getRequestHost(request)}`;
  const rawPath = new URL(request.url).searchParams.get("p") ?? "/";
  const pathname = rawPath.startsWith("/") ? rawPath : "/";
  const pageUrl = `${origin}${pathname}`;
  const cardUrl = (kind: "store" | "track") => `${origin}/api/storefront/share-card?tenant=${storefront.id}&k=${kind}`;

  let page = {
    title: tenant.title || tenant.name,
    description: tenant.description || `${tenant.name} online sipariş kataloğu. Ürünleri görmek için dokunun.`,
    imageUrl: cardUrl("store"),
    imageIsCard: true,
  };

  const productSlug = pathname.match(/^\/urun\/([^/?#]+)/)?.[1];
  if (productSlug) {
    const slug = decodeURIComponent(productSlug).trim();
    const supabase = createSupabaseAdminClient();
    if (supabase && /^[a-z0-9_-]+$/i.test(slug)) {
      const { data } = await supabase
        .from("products")
        .select("sku_code, product_name, image_url, is_alcohol")
        .eq("tenant_id", storefront.id)
        .ilike("sku_code", slug.replace(/_/g, "\\_"))
        .limit(5);
      const product = (data ?? []).find(
        (row) => String(row.sku_code ?? "").trim().toLowerCase() === slug.toLowerCase() && !row.is_alcohol,
      );
      if (product) {
        page = {
          // Ürün adı kodu zaten içeriyorsa (Lucatech: "Model: LP-505 | …") kod tekrarlanmaz.
          title:
            product.product_name && String(product.product_name).toLowerCase().includes(String(product.sku_code ?? "").toLowerCase())
              ? String(product.product_name)
              : [product.sku_code, product.product_name].filter(Boolean).join(" · "),
          description: `${tenant.name} · Ürünü görmek ve sipariş vermek için dokunun.`,
          imageUrl: product.image_url || cardUrl("store"),
          imageIsCard: !product.image_url,
        };
      }
    }
  } else if (pathname.startsWith("/siparis/")) {
    page = {
      title: `${tenant.name} · Sipariş Takip`,
      description: "Siparişinizin durumunu görmek için dokunun.",
      imageUrl: cardUrl("track"),
      imageIsCard: true,
    };
  }

  return new NextResponse(
    shareCardHtml({ ...page, pageUrl, targetUrl: pageUrl, siteName: tenant.name }).replace(
      /<meta http-equiv="refresh"[^>]*>\n/,
      "",
    ),
    {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
    },
  );
}
