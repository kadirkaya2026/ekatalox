import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeProductRecord } from "@/lib/products/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productVariantBulkUpdateSchema } from "@/lib/validators/product";

const productWithVariantPricesSelect =
  "*, variants:product_variants(*, prices:product_variant_prices(price_list_id, price))";

function isMissingVariantsTableError(message: string | undefined) {
  return (
    message?.includes("public.product_variants") ||
    message?.includes("product_variants") ||
    message?.includes("schema cache")
  );
}

function isMissingVariantPricesTableError(message: string | undefined) {
  return (
    message?.includes("public.product_variant_prices") ||
    message?.includes("product_variant_prices") ||
    isMissingVariantsTableError(message)
  );
}

async function fetchProductWithOptionalVariants(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productId: string,
  tenantId: string,
) {
  const withVariantPrices = await supabase
    .from("products")
    .select(productWithVariantPricesSelect)
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (!withVariantPrices.error && withVariantPrices.data) {
    return withVariantPrices.data;
  }

  const withVariants = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
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

async function syncVariantPrices(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  variants: Array<{
    id: string;
    prices?: Array<{ price_list_id: string; price: number }>;
  }>,
) {
  for (const variant of variants) {
    const { error: deleteError } = await supabase
      .from("product_variant_prices")
      .delete()
      .eq("variant_id", variant.id);

    if (deleteError) {
      if (isMissingVariantPricesTableError(deleteError.message)) {
        return {
          error:
            "Varyant fiyat tablosu henüz veritabanında oluşturulmamış. Migration uygulanınca fiyat kaydı aktif olacak.",
        };
      }

      return { error: deleteError.message };
    }

    const explicitPrices = variant.prices ?? [];

    if (!explicitPrices.length) {
      continue;
    }

    const { error: insertError } = await supabase.from("product_variant_prices").insert(
      explicitPrices.map((entry) => ({
        variant_id: variant.id,
        price_list_id: entry.price_list_id,
        price: entry.price,
      })),
    );

    if (insertError) {
      if (isMissingVariantPricesTableError(insertError.message)) {
        return {
          error:
            "Varyant fiyat tablosu henüz veritabanında oluşturulmamış. Migration uygulanınca fiyat kaydı aktif olacak.",
        };
      }

      return { error: insertError.message };
    }
  }

  return { error: null };
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/tenant/products/[id]/variants">,
) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const data = await fetchProductWithOptionalVariants(supabase, id, tenant.id);

  if (!data) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ product: normalizeProductRecord(data) });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tenant/products/[id]/variants">,
) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = productVariantBulkUpdateSchema.safeParse({
    productId: id,
    variants: body.variants,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues
            .map((issue) => {
              const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
              return `${path}${issue.message}`;
            })
            .join(" | ") || "Varyant verisi hatalı.",
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, tenant_id")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const { data: existingVariants, error: existingError } = await supabase
    .from("product_variants")
    .select("id, stock_quantity")
    .eq("product_id", id)
    .eq("tenant_id", tenant.id);

  if (existingError) {
    if (isMissingVariantsTableError(existingError.message)) {
      return NextResponse.json(
        {
          error:
            "Varyant tablosu henüz veritabanında oluşturulmamış. Migration uygulanınca bu ekran aktif olacak.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  const existingVariantRows =
    (existingVariants as Array<{ id: string; stock_quantity: number | null }> | null) ?? [];
  const existingVariantIds = new Set(
    existingVariantRows.map((variant) => variant.id),
  );
  const existingVariantMap = new Map(
    existingVariantRows.map((variant) => [variant.id, variant]),
  );

  const invalidVariant = parsed.data.variants.find(
    (variant) => variant.id && !existingVariantIds.has(variant.id),
  );

  if (invalidVariant?.id) {
    return NextResponse.json(
      { error: "Geçersiz varyant satırı algılandı." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const payload = parsed.data.variants.map((variant, index) => {
    const existingVariant = variant.id ? existingVariantMap.get(variant.id) : undefined;
    const existingStockQuantity =
      typeof existingVariant?.stock_quantity === "number"
        ? existingVariant.stock_quantity
        : 0;
    const fallbackStockQuantity = Math.max(
      variant.package_quantity ?? 0,
      variant.carton_quantity ?? 0,
      1,
    );
    const nextStockQuantity =
      typeof variant.stock_quantity === "number"
        ? variant.stock_quantity
        : variant.is_available_for_sale
          ? Math.max(existingStockQuantity, fallbackStockQuantity)
          : existingStockQuantity > 0
            ? existingStockQuantity
            : fallbackStockQuantity;

    return {
      id: variant.id ?? randomUUID(),
      tenant_id: tenant.id,
      product_id: id,
      model_name: variant.model_name,
      stock_quantity: nextStockQuantity,
      package_quantity: variant.package_quantity,
      carton_quantity: variant.carton_quantity,
      is_available_for_sale: variant.is_available_for_sale,
      display_order: variant.display_order ?? index + 1,
      updated_at: now,
      prices: variant.prices,
    };
  });

  const variantPricePayload = payload.map((variant) => ({
    id: variant.id,
    prices: variant.prices,
  }));

  const nextVariantIds = new Set(payload.map((variant) => variant.id));
  const deletedVariantIds = [...existingVariantIds].filter((variantId) => !nextVariantIds.has(variantId));

  if (deletedVariantIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("product_id", id)
      .in("id", deletedVariantIds);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  const { error: upsertError } = await supabase
    .from("product_variants")
    .upsert(
      payload.map(({ prices: _prices, ...variant }) => variant),
    );

  if (upsertError) {
    if (isMissingVariantsTableError(upsertError.message)) {
      return NextResponse.json(
        {
          error:
            "Varyant tablosu henüz veritabanında oluşturulmamış. Migration uygulanınca kaydetme aktif olacak.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const priceSyncResult = await syncVariantPrices(supabase, variantPricePayload);

  if (priceSyncResult.error) {
    return NextResponse.json({ error: priceSyncResult.error }, { status: 503 });
  }

  const data = await fetchProductWithOptionalVariants(supabase, id, tenant.id);

  if (!data) {
    return NextResponse.json(
      { error: "Ürün tekrar okunamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({ product: normalizeProductRecord(data) });
}