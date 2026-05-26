import { NextResponse } from "next/server";
import { getTenantProducts } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productReorderSchema } from "@/lib/validators/product";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = productReorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Sıralama verisi geçersiz." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    const currentProducts = await getTenantProducts(tenant.id);
    const productMap = new Map(currentProducts.map((product) => [product.id, product]));

    return NextResponse.json(
      {
        products: parsed.data.productIds
          .map((id, index) => {
            const product = productMap.get(id);

            if (!product) {
              return null;
            }

            return {
              ...product,
              display_order: index + 1,
            };
          })
          .filter(Boolean),
      },
      { status: 200 },
    );
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("tenant_id", tenant.id)
    .in("id", parsed.data.productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 400 });
  }

  if ((products ?? []).length !== parsed.data.productIds.length) {
    return NextResponse.json(
      { error: "Bazı ürünler bulunamadı veya bu tenant'a ait değil." },
      { status: 400 },
    );
  }

  for (const [index, id] of parsed.data.productIds.entries()) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ display_order: index + 1 })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  const { data: reorderedProducts, error: reorderedError } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (reorderedError) {
    return NextResponse.json({ error: reorderedError.message }, { status: 400 });
  }

  return NextResponse.json({ products: reorderedProducts ?? [] });
}