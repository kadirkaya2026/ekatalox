import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productBulkStockUpdateSchema } from "@/lib/validators/product";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const body = await request.json();
  const parsed = productBulkStockUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  const { productIds, is_in_stock } = parsed.data;

  const { error: updateError } = await supabase
    .from("products")
    .update({ is_in_stock })
    .eq("tenant_id", tenant.id)
    .in("id", productIds);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { data: updatedProducts, error: fetchError } = await supabase
    .from("products")
    .select(productWithVariantsAndPricesSelect)
    .eq("tenant_id", tenant.id)
    .in("id", productIds);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  return NextResponse.json({
    updatedProducts: (updatedProducts ?? []).map((product) => normalizeProductRecord(product)),
  });
}
