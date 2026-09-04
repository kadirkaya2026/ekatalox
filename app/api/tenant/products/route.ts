import { randomUUID } from "node:crypto";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { NextResponse } from "next/server";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { parseProductPricesFromFormData } from "@/lib/products/form-prices";
import { upsertProductPrices } from "@/lib/price-lists/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ProductImageValidationError,
  uploadProductImage,
} from "@/lib/storage/product-images";
import { getSessionContext } from "@/lib/auth/session";
import { getEffectiveProductLimit, hasPlanFeature } from "@/lib/billing/plans";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { parseProductStockFilter } from "@/lib/products/constants";
import { productCreateSchema } from "@/lib/validators/product";
import { getTenantProductIdsForFilter, getTenantProductsPage } from "@/lib/data";

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const search = url.searchParams.get("q") ?? undefined;
  const categoryIds = url.searchParams.get("categoryIds")?.split(",").filter(Boolean);
  const matchCategoryIds = url.searchParams.get("matchCategoryIds")?.split(",").filter(Boolean);
  const stockFilter = parseProductStockFilter(url.searchParams.get("stock"));

  // "Filtreye uyan tümünü seç": sayfalama olmadan sadece id listesi ister.
  if (url.searchParams.get("idsOnly") === "1") {
    const ids = await getTenantProductIdsForFilter({
      tenantId: tenant.id,
      search,
      categoryIds,
      matchCategoryIds,
      stockFilter,
    });
    return NextResponse.json({ ids });
  }

  // Belirli id'lerin tam ürün nesnelerini döner — kampanya formu (N al Y
  // hediye) kaydedilmiş ürün id'lerinin adını göstermek için kullanır.
  const idsParam = url.searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 50);
    const supabase = createSupabaseAdminClient();
    if (!supabase || !ids.length) {
      return NextResponse.json({ products: [] });
    }
    const { data } = await supabase
      .from("products")
      .select(productWithVariantsAndPricesSelect)
      .eq("tenant_id", tenant.id)
      .in("id", ids);
    return NextResponse.json({ products: (data ?? []).map(normalizeProductRecord) });
  }

  const { products, total } = await getTenantProductsPage({
    tenantId: tenant.id,
    page,
    search,
    categoryIds,
    matchCategoryIds,
    stockFilter,
  });

  return NextResponse.json({ products, total });
}

async function fetchCreatedProduct(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productId: string,
  tenantId: string,
) {
  const withVariants = await supabase
    .from("products")
    .select(productWithVariantsAndPricesSelect)
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (!withVariants.error && withVariants.data) {
    return withVariants.data;
  }

  const fallback = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  return fallback.data;
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  try {
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const formData = await request.formData();
  const parsed = productCreateSchema.safeParse({
    category_id: formData.get("category_id"),
    sku_code: formData.get("sku_code"),
    product_name: formData.get("product_name"),
    currency: formData.get("currency"),
    prices: parseProductPricesFromFormData(formData),
    is_in_stock: formData.get("is_in_stock"),
    is_recommended: formData.get("is_recommended"),
    package_quantity: formData.get("package_quantity"),
    carton_quantity: formData.get("carton_quantity"),
    description: formData.get("description"),
    is_discount_active: formData.get("is_discount_active"),
    discount_price: formData.get("discount_price"),
    purchase_price: formData.get("purchase_price"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ürün verisi hatalı." },
      { status: 400 },
    );
  }

  const plan = tenant.plan ?? "baslangic";
  if (parsed.data.is_discount_active && !hasPlanFeature(plan, "product_discount")) {
    return NextResponse.json(
      { error: "Ürün indirimi Başlangıç paketinde kullanılamaz." },
      { status: 403 },
    );
  }

  const image = formData.get("image");
  const image2 = formData.get("image_2");
  const image3 = formData.get("image_3");
  const supabase = createSupabaseAdminClient();
  const productId = randomUUID();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  const effectiveLimit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);

  if ((count ?? 0) >= effectiveLimit) {
    return NextResponse.json(
      { error: "Ürün limitiniz dolu. Yeni ürün ekleyemezsiniz." },
      { status: 400 },
    );
  }

  let imageUrl: string | null = null;
  let imageUrl2: string | null = null;
  let imageUrl3: string | null = null;

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage({
      supabase,
      tenantId: tenant.id,
      productId,
      file: image,
    });
  }

  if (image2 instanceof File && image2.size > 0) {
    imageUrl2 = await uploadProductImage({
      supabase,
      tenantId: tenant.id,
      productId,
      file: image2,
      slot: 2,
    });
  }

  if (image3 instanceof File && image3.size > 0) {
    imageUrl3 = await uploadProductImage({
      supabase,
      tenantId: tenant.id,
      productId,
      file: image3,
      slot: 3,
    });
  }

  const { data: lastProduct } = await supabase
    .from("products")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    id: productId,
    tenant_id: tenant.id,
    display_order: (lastProduct?.display_order ?? 0) + 1,
    category_id: parsed.data.category_id,
    sku_code: parsed.data.sku_code,
    product_name: parsed.data.product_name,
    currency: parsed.data.currency,
    is_in_stock: parsed.data.is_in_stock,
    is_recommended: parsed.data.is_recommended,
    package_quantity: parsed.data.package_quantity,
    carton_quantity: parsed.data.carton_quantity,
    description: parsed.data.description,
    is_discount_active: parsed.data.is_discount_active,
    discount_price: parsed.data.discount_price,
    purchase_price: parsed.data.purchase_price,
    image_url: imageUrl,
    image_url_2: imageUrl2,
    image_url_3: imageUrl3,
  };

  const { error } = await supabase
    .from("products")
    .insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const priceError = await upsertProductPrices(supabase, productId, parsed.data.prices);

  if (priceError) {
    return NextResponse.json(
      { error: priceError.message || "Ürün fiyatları kaydedilemedi." },
      { status: 400 },
    );
  }

  const product = await fetchCreatedProduct(supabase, productId, tenant.id);

  if (!product) {
    return NextResponse.json({ error: "Ürün kaydedildi ama okunamadı." }, { status: 400 });
  }

  // Vitrin onbellegini tazele: aksi halde urun degisikligi musteriye
  // 60 sn veri onbellegi + CDN kopyasi kadar gec yansiyordu.
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ product: normalizeProductRecord(product) });
  } catch (error) {
    if (error instanceof ProductImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Ürün kaydedilemedi." }, { status: 500 });
  }
}
