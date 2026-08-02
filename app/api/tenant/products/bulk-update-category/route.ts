import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productBulkCategoryUpdateSchema } from "@/lib/validators/product";

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
  const parsed = productBulkCategoryUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  const { productIds, category_id } = parsed.data;

  // Seçilen kategorinin bu tenanta ait olduğunu doğrula
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", category_id)
    .eq("tenant_id", tenant.id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json(
      { error: "Seçilen kategori bulunamadı veya erişim yetkisi yok." },
      { status: 404 },
    );
  }

  // Ürünlerin tenanta ait olduğunu kontrol ederek güncelle
  const { data: updatedProducts, error: updateError } = await supabase
    .from("products")
    .update({ category_id })
    .eq("tenant_id", tenant.id)
    .in("id", productIds)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ updatedProducts });
}
