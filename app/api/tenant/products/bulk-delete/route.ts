import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import {
  PRODUCT_IMAGES_BUCKET,
} from "@/lib/storage/product-images";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productBulkDeleteSchema } from "@/lib/validators/product";

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

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, image_url")
    .eq("tenant_id", tenant.id)
    .in("id", parsed.data.productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 400 });
  }

  if (!products?.length) {
    return NextResponse.json({ error: "Silinecek ürün bulunamadı." }, { status: 404 });
  }

  const imagePaths = Array.from(
    new Set(
      products
        .map((product) =>
          getStorageObjectPathFromPublicUrl(
            product.image_url,
            PRODUCT_IMAGES_BUCKET,
          ),
        )
        .filter((path): path is string => Boolean(path)),
    ),
  );

  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(imagePaths);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 400 });
    }
  }

  const deletableIds = products.map((product) => product.id);
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("tenant_id", tenant.id)
    .in("id", deletableIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ deletedIds: deletableIds });
}