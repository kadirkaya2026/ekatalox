import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { getSessionContext } from "@/lib/auth/session";
import {
  PRODUCT_IMAGES_BUCKET,
} from "@/lib/storage/product-images";
import { filterRemovableProductImagePaths } from "@/lib/storage/safe-product-image-removal";
import { compactProductDisplayOrder } from "@/lib/products/reorder";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { chunkArray } from "@/lib/utils";
import { productBulkDeleteSchema } from "@/lib/validators/product";

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
  const body = await request.json();
  const parsed = productBulkDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const products: Array<{
    id: string;
    image_url: string | null;
    image_url_2: string | null;
    image_url_3: string | null;
  }> = [];

  for (const idsChunk of chunkArray(parsed.data.productIds, ID_CHUNK_SIZE)) {
    const { data, error: productsError } = await supabase
      .from("products")
      .select("id, image_url, image_url_2, image_url_3")
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 400 });
    }

    products.push(...(data ?? []));
  }

  if (!products.length) {
    return NextResponse.json({ error: "Silinecek ürün bulunamadı." }, { status: 404 });
  }

  const deletableIds = products.map((product) => product.id);

  // Yalnız bu tenant'ın klasöründeki ve başka yerde kullanılmayan dosyalar
  // silinir (katalogdan gelen / paylaşılan görseller korunur). Dosya silme
  // hatası ürün silmeyi engellemez; en kötü ihtimalle sahipsiz dosya kalır.
  const imagePaths = await filterRemovableProductImagePaths(supabase, {
    tenantId: tenant.id,
    urls: products.flatMap((product) => [product.image_url, product.image_url_2, product.image_url_3]),
    excludeProductIds: deletableIds,
  });

  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(imagePaths);
    if (storageError) {
      console.error("[bulk-delete] görsel dosyaları silinemedi:", storageError.message);
    }
  }

  for (const idsChunk of chunkArray(deletableIds, ID_CHUNK_SIZE)) {
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  await compactProductDisplayOrder(supabase, tenant.id);

  // Vitrin onbellegini tazele: aksi halde stok/fiyat degisikligi
  // musteriye 60 sn veri onbellegi + CDN kopyasi kadar gec yansiyordu.
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ deletedIds: deletableIds });
}