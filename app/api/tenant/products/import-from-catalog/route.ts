import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { ensureDefaultPriceListsForTenant } from "@/lib/price-lists/data";
import { getPricedLists } from "@/lib/price-lists/records";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { chunkArray } from "@/lib/utils";
import { importProductsFromMasterCatalog } from "@/lib/products/import-from-master-catalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UPSERT_CHUNK_SIZE = 500;

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const skuCodes: string[] = Array.isArray(body.sku_codes)
    ? (body.sku_codes as unknown[]).filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];

  if (!skuCodes.length) {
    return NextResponse.json({ error: "Aktarılacak ürün seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase production yapılandırması eksik." },
      { status: 500 },
    );
  }

  const result = await importProductsFromMasterCatalog(supabase, tenant, skuCodes);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (result.skippedForLimitCount > 0 && result.insertedProducts.length === 0) {
    return NextResponse.json(
      { error: "Seçilen ürünler ürün limitinizi aşıyor. Daha az ürün seçin veya paketinizi yükseltin." },
      { status: 400 },
    );
  }

  // Master katalogdaki referans fiyat varsa, tenant'ın fiyat listelerine
  // başlangıç önerisi olarak yazılır — admin dilerse Düzenle'den değiştirir.
  const pricedLists = getPricedLists(await ensureDefaultPriceListsForTenant(supabase, tenant.id));

  if (pricedLists.length) {
    const priceRows = result.insertedProducts.flatMap((product) => {
      const referencePrice = result.referencePriceBySku.get(product.sku_code);
      if (typeof referencePrice !== "number") {
        return [];
      }
      return pricedLists.map((list) => ({
        product_id: product.id,
        price_list_id: list.id,
        price: referencePrice,
      }));
    });

    for (const batch of chunkArray(priceRows, UPSERT_CHUNK_SIZE)) {
      const { error: priceError } = await supabase
        .from("product_prices")
        .upsert(batch, { onConflict: "product_id,price_list_id" });

      if (priceError) {
        return NextResponse.json({ error: priceError.message }, { status: 400 });
      }
    }
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({
    importedCount: result.insertedProducts.length,
    skippedForLimitCount: result.skippedForLimitCount,
  });
}
