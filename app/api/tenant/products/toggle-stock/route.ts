import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
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

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      product: {
        id: productId,
        is_in_stock,
      },
    });
  }

  const { data, error } = await supabase
    .from("products")
    .update({ is_in_stock })
    .eq("id", productId)
    .eq("tenant_id", tenant.id)
    .select("id, is_in_stock")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}