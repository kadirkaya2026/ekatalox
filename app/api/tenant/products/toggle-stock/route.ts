import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

async function fetchToggledProduct(
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

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const productId = String(body.productId ?? "");
  const is_in_stock = Boolean(body.is_in_stock);

  if (!productId) {
    return NextResponse.json({ error: "Ürün seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .from("products")
    .update({ is_in_stock })
    .eq("id", productId)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const product = await fetchToggledProduct(supabase, productId, tenant.id);

  if (!product) {
    return NextResponse.json({ error: "Stok güncellendi ama ürün okunamadı." }, { status: 400 });
  }

  // Vitrin onbellegini tazele: aksi halde stok/fiyat degisikligi
  // musteriye 60 sn veri onbellegi + CDN kopyasi kadar gec yansiyordu.
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ product: normalizeProductRecord(product) });
}
