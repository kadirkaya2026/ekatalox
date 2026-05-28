import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeProductRecord } from "@/lib/products/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productVariantBulkUpdateSchema } from "@/lib/validators/product";

function isMissingVariantsTableError(message: string | undefined) {
  return (
    message?.includes("public.product_variants") ||
    message?.includes("product_variants") ||
    message?.includes("schema cache")
  );
}

async function fetchProductWithOptionalVariants(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productId: string,
  tenantId: string,
) {
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
    .select("id")
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

  const existingVariantIds = new Set(
    ((existingVariants as Array<{ id: string }> | null) ?? []).map((variant) => variant.id),
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
  const payload = parsed.data.variants.map((variant, index) => ({
    id: variant.id ?? randomUUID(),
    tenant_id: tenant.id,
    product_id: id,
    model_name: variant.model_name,
    stock_quantity: variant.stock_quantity,
    package_quantity: variant.package_quantity,
    carton_quantity: variant.carton_quantity,
    is_available_for_sale:
      variant.stock_quantity === 0 ? false : variant.is_available_for_sale,
    display_order: variant.display_order ?? index + 1,
    updated_at: now,
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
    .upsert(payload);

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

  const data = await fetchProductWithOptionalVariants(supabase, id, tenant.id);

  if (!data) {
    return NextResponse.json(
      { error: "Ürün tekrar okunamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({ product: normalizeProductRecord(data) });
}