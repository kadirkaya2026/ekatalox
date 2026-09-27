import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";
import { isTrialExpired } from "@/lib/billing/trial";
import { isStorefrontPriceListStateValid, readStorefrontPriceList } from "@/lib/storefront/session";
import { getStorefrontProductPath } from "@/lib/storefront/paths";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Ürün sayfasında "Renkler" (28 Eyl 2026): aynı modelin diğer renkleri.
// Model kodu "TABAN-RENK" biçiminde (ör. ST20260S201618001-ACIKAHVE); yalnız
// Moda kart stilli (tekstil) vitrinlerde — diğer sektörlerde kod yapısı
// farklı olduğundan yanlış gruplama yapmasın. Erişim /products ile aynı.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain");
  const productId = url.searchParams.get("productId");
  const empty = NextResponse.json({ colors: [] });
  if (!subdomain || !productId || !/^[0-9a-f-]{36}$/i.test(productId)) return empty;

  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant || tenant.status !== "active" || isTrialExpired(tenant)) return empty;
  const priceListState = await readStorefrontPriceList(subdomain);
  if (!priceListState || !isStorefrontPriceListStateValid({ cookieState: priceListState, tenant })) return empty;
  const settings = await getTenantStorefrontSettings(tenant.id);
  if (settings.product_card_style !== "fashion") return empty;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return empty;
  const { data: product } = await supabase
    .from("products")
    .select("sku_code")
    .eq("tenant_id", tenant.id)
    .eq("id", productId)
    .maybeSingle();
  const sku = product?.sku_code?.trim() ?? "";
  const base = sku.replace(/-[^-]+$/, "");
  if (!base || base === sku || base.length < 6) return empty;

  const { data } = await supabase
    .from("products")
    .select("id, sku_code, product_name, image_url, is_in_stock")
    .eq("tenant_id", tenant.id)
    .ilike("sku_code", `${base.replace(/[%_]/g, "\\$&")}-%`)
    .order("sku_code")
    .limit(24);

  const colors = (data ?? []).map((row) => ({
    id: row.id,
    name: row.product_name,
    image_url: row.image_url,
    is_in_stock: row.is_in_stock,
    href: getStorefrontProductPath(row),
    current: row.id === productId,
  }));
  return NextResponse.json({ colors: colors.length > 1 ? colors : [] });
}
