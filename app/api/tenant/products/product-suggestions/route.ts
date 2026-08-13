import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productSuggestionCreateSchema } from "@/lib/validators/product-suggestion";

// Stok listesi eşleştirmesinde (bkz. stock-import-panel.tsx) sistemde
// bulunamayan bir satır için tenant admin "eklenmesini öner" dediğinde
// buraya düşer; süper admin /admin/product-suggestions'tan onaylar/reddeder.
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const body = await request.json().catch(() => null);
  const parsed = productSuggestionCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
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

  const { data, error } = await supabase
    .from("product_suggestions")
    .insert({
      tenant_id: tenant.id,
      barcode: parsed.data.barcode,
      product_name: parsed.data.product_name,
      price: parsed.data.price ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ suggestion: data });
}
