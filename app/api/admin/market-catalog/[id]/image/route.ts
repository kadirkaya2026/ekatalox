import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import {
  ProductImageValidationError,
  uploadMarketCatalogImage,
} from "@/lib/storage/market-catalog-images";

// Master Katalog görseli yükleme — SADECE süper admin. Dosya kendi
// storage'ımıza gider, dış CDN'e hotlink bırakılmaz; dönen public URL
// PATCH /api/admin/market-catalog/[id] ile image_url olarak kaydedilir
// (burada DB'ye yazılmaz ki admin kaydetmeden vazgeçebilsin).
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/market-catalog/[id]/image">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: product } = await supabase
    .from("market_catalog_products")
    .select("sku_code")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const image = formData?.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Resim dosyası gerekli." }, { status: 400 });
  }

  try {
    const imageUrl = await uploadMarketCatalogImage({
      supabase,
      skuCode: product.sku_code as string,
      file: image,
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof ProductImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Görsel yüklenemedi." }, { status: 500 });
  }
}
