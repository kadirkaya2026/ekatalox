import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { getSessionContext } from "@/lib/auth/session";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { chunkArray } from "@/lib/utils";
import { productBulkStockUpdateSchema } from "@/lib/validators/product";

// Yüzlerce id'yi tek bir .in() filtresine sıkıştırmak istek URL'sini
// reverse proxy'lerin izin verdiği uzunluğun üstüne çıkarıp Bad Request
// verdiriyor — bu yüzden id listesini parçalara bölüp işliyoruz.
const ID_CHUNK_SIZE = 200;

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
  const idChunks = chunkArray(productIds, ID_CHUNK_SIZE);

  for (const idsChunk of idChunks) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ is_in_stock })
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  const updatedProducts: Array<Record<string, unknown>> = [];

  for (const idsChunk of idChunks) {
    const { data, error: fetchError } = await supabase
      .from("products")
      .select(productWithVariantsAndPricesSelect)
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    updatedProducts.push(...((data as Array<Record<string, unknown>> | null) ?? []));
  }

  // Vitrin onbellegini tazele: aksi halde stok/fiyat degisikligi
  // musteriye 60 sn veri onbellegi + CDN kopyasi kadar gec yansiyordu.
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({
    updatedProducts: updatedProducts.map((product) => normalizeProductRecord(product)),
  });
}
