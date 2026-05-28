import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canSelectVariantUnit, isVariantPurchasable } from "@/lib/storefront/variants";
import { storefrontVariantAvailabilitySchema } from "@/lib/validators/product";

type VariantRow = {
  id: string;
  product_id: string;
  model_name: string;
  stock_quantity: number;
  package_quantity: number | null;
  carton_quantity: number | null;
  is_available_for_sale: boolean;
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = storefrontVariantAvailabilitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Seçim verisi hatalı." },
      { status: 400 },
    );
  }

  const tenant = await getStorefrontTenant(parsed.data.subdomain);

  if (!tenant || tenant.status !== "active") {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
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
    .select("id, is_in_stock")
    .eq("tenant_id", tenant.id)
    .eq("id", parsed.data.productId)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const variantIds = parsed.data.selections.map((selection) => selection.variantId);
  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_id, model_name, stock_quantity, package_quantity, carton_quantity, is_available_for_sale")
    .eq("tenant_id", tenant.id)
    .eq("product_id", parsed.data.productId)
    .in("id", variantIds);

  if (variantError) {
    return NextResponse.json({ error: variantError.message }, { status: 400 });
  }

  const variantMap = new Map(
    ((variants as VariantRow[] | null) ?? []).map((variant) => [variant.id, variant]),
  );

  const invalidSelections = parsed.data.selections.flatMap((selection) => {
    const variant = variantMap.get(selection.variantId);

    if (!variant) {
      return [
        {
          variantId: selection.variantId,
          message: "Model bulunamadı.",
        },
      ];
    }

    if (
      !isVariantPurchasable({
        productInStock: Boolean(product.is_in_stock),
        variant,
      })
    ) {
      return [
        {
          variantId: selection.variantId,
          message: `${variant.model_name} şu anda tükenmiş.`,
        },
      ];
    }

    if (
      !canSelectVariantUnit({
        unit: selection.unit,
        quantity: selection.quantity,
        variant,
      })
    ) {
      return [
        {
          variantId: selection.variantId,
          message: `${variant.model_name} için yetersiz stok.`,
        },
      ];
    }

    return [];
  });

  if (invalidSelections.length > 0) {
    return NextResponse.json(
      {
        error: invalidSelections[0]?.message ?? "Stok doğrulaması başarısız.",
        invalidSelections,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}