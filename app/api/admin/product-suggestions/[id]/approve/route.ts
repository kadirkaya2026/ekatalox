import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantPriceLists } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { getPricedLists } from "@/lib/price-lists/records";
import {
  MARKET_CATEGORY_ANCESTORS,
  resolveCategoryPath,
} from "@/lib/market-catalog/category-taxonomy";
import {
  buildCategoryCache,
  ensureCategoryPath,
} from "@/lib/categories/ensure-hierarchy";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { productSuggestionApproveSchema } from "@/lib/validators/product-suggestion";

// Süper admin bir "ürün öner" isteğini onayladığında: (1) ürün paylaşılan
// Master Kataloga (market_catalog_products) eklenir/eşleştirilir ki başka
// marketler de aynı barkodu tekrar önermek zorunda kalmasın, (2) öneriyi
// yapan tenant'ın kendi products tablosuna stoklu olarak eklenir, (3) fiyat
// varsa tenant'ın tüm fiyatlı listelerine yazılır — bkz. import-from-catalog
// route'undaki aynı referans-fiyat yayma deseni.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/product-suggestions/[id]/approve">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const session = await getSessionContext();
  const body = await request.json().catch(() => null);
  const parsed = productSuggestionApproveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  if (!(parsed.data.category_name in MARKET_CATEGORY_ANCESTORS)) {
    return NextResponse.json({ error: "Geçersiz kategori seçimi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { data: suggestion, error: suggestionError } = await supabase
    .from("product_suggestions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (suggestionError || !suggestion) {
    return NextResponse.json({ error: "Öneri bulunamadı." }, { status: 404 });
  }

  if (suggestion.status !== "pending") {
    return NextResponse.json({ error: "Bu öneri zaten işlenmiş." }, { status: 400 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, subdomain")
    .eq("id", suggestion.tenant_id)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Bayi bulunamadı." }, { status: 404 });
  }

  // Süper admin onaydan önce ad/fiyat/barkod/görseli düzeltmiş olabilir —
  // boş bırakılan alanlarda önerideki orijinal değer kullanılır (kullanıcı
  // isteği, 19 Ağu 2026).
  const effectiveBarcode = parsed.data.barcode?.trim() || suggestion.barcode;
  const effectiveProductName = parsed.data.product_name?.trim() || suggestion.product_name;
  const effectivePrice = parsed.data.price !== undefined ? parsed.data.price : suggestion.price;
  const effectiveImageUrl = parsed.data.image_url !== undefined ? parsed.data.image_url : null;

  // Aynı barkod (herhangi bir kaynaktan) zaten Master Katalogda varsa onu
  // kullan; yoksa bu öneriden yeni bir katalog satırı oluştur.
  //
  // maybeSingle() KULLANILMIYOR: UNIQUE kısıt (source, sku_code) olduğu için
  // aynı barkod farklı kaynaklarda (migros_crawl + tenant_stock_import gibi)
  // birden fazla satır olabilir. maybeSingle() bu durumda hata döndürüp
  // data'yı null yapıyordu, kod da "katalogda yok" sanıp bir kopya daha
  // yaratıyordu. En eski satır kanonik kabul ediliyor.
  const { data: existingCatalogRows } = await supabase
    .from("market_catalog_products")
    .select("*")
    .eq("sku_code", effectiveBarcode)
    .order("created_at", { ascending: true });

  let marketCatalogProduct = existingCatalogRows?.[0] ?? null;

  if (!marketCatalogProduct) {
    const { data: inserted, error: insertCatalogError } = await supabase
      .from("market_catalog_products")
      .insert({
        source: "tenant_suggestion",
        sku_code: effectiveBarcode,
        product_name: effectiveProductName,
        category_name: parsed.data.category_name,
        reference_price: effectivePrice,
        image_url: effectiveImageUrl,
      })
      .select("*")
      .single();

    if (insertCatalogError) {
      return NextResponse.json({ error: insertCatalogError.message }, { status: 400 });
    }

    marketCatalogProduct = inserted;
  } else {
    // Satır zaten vardı. Süper adminin onay ekranında girdiği değerler
    // eskiden TAMAMEN yok sayılıyordu; seçilen kategori sadece bayinin kendi
    // ürününe uygulanıyor, Master Katalog satırı ör. stok listesi
    // yüklemesinden gelen "Diğer" kategorisinde kalıyordu (kullanıcı
    // bildirimi). Artık SADECE eksik/geçersiz alanlar dolduruluyor —
    // küratörlü (ör. migros_crawl) satırların geçerli değerleri korunuyor.
    const patch: Record<string, unknown> = {};

    const existingCategory = marketCatalogProduct.category_name as string | null;
    if (!existingCategory || !(existingCategory in MARKET_CATEGORY_ANCESTORS)) {
      patch.category_name = parsed.data.category_name;
    }
    if (!(marketCatalogProduct.product_name as string | null)?.trim()) {
      patch.product_name = effectiveProductName;
    }
    if (marketCatalogProduct.reference_price === null && typeof effectivePrice === "number") {
      patch.reference_price = effectivePrice;
    }
    if (!(marketCatalogProduct.image_url as string | null) && effectiveImageUrl) {
      patch.image_url = effectiveImageUrl;
    }

    if (Object.keys(patch).length) {
      const { data: patched } = await supabase
        .from("market_catalog_products")
        .update(patch)
        .eq("id", marketCatalogProduct.id)
        .select("*")
        .single();

      if (patched) {
        marketCatalogProduct = patched;
      }
    }
  }

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("tenant_id", tenant.id);
  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const categoryCache = buildCategoryCache(
    (categoryRows as Array<{ id: string; name: string; parent_id: string | null }> | null) ?? [],
  );
  const nextCategoryDisplayOrder = { value: (lastCategory?.display_order ?? 0) + 1 };

  let leafCategoryId: string;
  try {
    leafCategoryId = await ensureCategoryPath(
      supabase,
      tenant.id,
      categoryCache,
      resolveCategoryPath(parsed.data.category_name),
      nextCategoryDisplayOrder,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "bilinmeyen hata";
    return NextResponse.json({ error: `Kategori oluşturulamadı: ${message}` }, { status: 400 });
  }

  const { data: lastProduct } = await supabase
    .from("products")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        tenant_id: tenant.id,
        category_id: leafCategoryId,
        sku_code: effectiveBarcode,
        product_name: effectiveProductName,
        image_url: effectiveImageUrl ?? marketCatalogProduct.image_url,
        // Süper admin onayladığında ürün tenant'ın Ürünler sayfasında
        // STOĞU KAPALI görünür — tenant isterse kendisi açar (kullanıcı
        // isteği, 19 Ağu 2026): ürün fiyat/görsel/kategori açısından hazır
        // olsa da satışa açılıp açılmayacağına tenant karar vermeli.
        is_in_stock: false,
        display_order: (lastProduct?.display_order ?? 0) + 1,
      },
      { onConflict: "tenant_id,sku_code" },
    )
    .select("id")
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 400 });
  }

  if (typeof effectivePrice === "number") {
    const pricedLists = getPricedLists(await getTenantPriceLists(tenant.id));

    if (pricedLists.length) {
      const { error: priceError } = await supabase.from("product_prices").upsert(
        pricedLists.map((list) => ({
          product_id: product.id,
          price_list_id: list.id,
          price: effectivePrice,
        })),
        { onConflict: "product_id,price_list_id" },
      );

      if (priceError) {
        return NextResponse.json({ error: priceError.message }, { status: 400 });
      }
    }
  }

  const { error: updateError } = await supabase
    .from("product_suggestions")
    .update({
      status: "approved",
      category_name: parsed.data.category_name,
      barcode: effectiveBarcode,
      product_name: effectiveProductName,
      price: effectivePrice,
      image_url: effectiveImageUrl,
      market_catalog_product_id: marketCatalogProduct.id,
      product_id: product.id,
      reviewed_by: session.profile!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ success: true, productId: product.id });
}
