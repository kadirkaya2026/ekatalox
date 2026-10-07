import { NextResponse } from "next/server";
import { getStorefrontProductsByIds } from "@/lib/data";
import { readStorefrontPriceList } from "@/lib/storefront/session";
import { resolveStorefrontAccount } from "@/lib/storefront/account";

// Hesabım > "Tekrar sipariş ver": eski siparişin satırları + ürünlerin BUGÜNKÜ
// fiyat/stok bilgisi (müşterinin şu anki fiyat listesiyle). Sepete ekleme
// istemcide, normal "sepete ekle" kurallarıyla yapılır.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain");
  const orderId = url.searchParams.get("order");
  const ctx = await resolveStorefrontAccount(subdomain);
  if (!ctx || !orderId) return NextResponse.json({ error: "Giriş gerekli." }, { status: 403 });

  const { data: order } = await ctx.supabase
    .from("orders")
    .select("id, items, access_code_id")
    .eq("tenant_id", ctx.tenant.id)
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.access_code_id !== ctx.profile.accessCodeId) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const lines = ((Array.isArray(order.items) ? order.items : []) as Array<{
    product_id?: string | null;
    variant_id?: string | null;
    quantity?: number | null;
    is_gift?: boolean | null;
  }>)
    .filter((item) => item.product_id && !item.is_gift && Number(item.quantity) > 0)
    .map((item) => ({
      product_id: item.product_id as string,
      variant_id: item.variant_id ?? null,
      quantity: Math.round(Number(item.quantity)),
    }));

  const cookie = await readStorefrontPriceList(subdomain!);
  const ids = [...new Set(lines.map((line) => line.product_id))].slice(0, 50);
  const products = ids.length && cookie
    ? await getStorefrontProductsByIds({
        tenantId: ctx.tenant.id,
        priceListId: cookie.priceListId,
        isCatalogOnly: cookie.isCatalogOnly,
        ids,
      })
    : [];

  return NextResponse.json({ lines, products });
}
