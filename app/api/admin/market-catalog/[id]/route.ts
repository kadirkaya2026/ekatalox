import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { marketCatalogUpdateSchema } from "@/lib/validators/market-catalog";

// Master Katalog satırını düzenleme/silme — SADECE süper admin.
// Tenant tarafında bu tabloya UPDATE atan hiçbir uç nokta yok; stok listesi
// yükleme sadece henüz olmayan barkodlar için yeni satır ekler.
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/market-catalog/[id]">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = marketCatalogUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ürün verisi hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("market_catalog_products")
    .update({
      product_name: parsed.data.product_name,
      sku_code: parsed.data.sku_code,
      brand: parsed.data.brand ?? null,
      category_name: parsed.data.category_name,
      reference_price: parsed.data.reference_price ?? null,
      description: parsed.data.description ?? null,
      image_url: parsed.data.image_url ?? null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    // (source, sku_code) UNIQUE — aynı kaynakta o barkod zaten varsa.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Bu barkod aynı kaynakta zaten kayıtlı." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/market-catalog/[id]">,
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

  // Katalogdan silmek tenant'ların KENDİ products satırlarını etkilemez —
  // import sırasında değerler kopyalanıyor, FK kurulmuyor. Sadece
  // product_suggestions.market_catalog_product_id null'lanır (on delete set
  // null), öneri geçmişi bozulmaz.
  const { error } = await supabase
    .from("market_catalog_products")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
