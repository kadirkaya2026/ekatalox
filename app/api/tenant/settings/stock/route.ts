import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ayarlar → Stokta Olmayan Ürünler (0149, 30 Eyl 2026): stok dışı ürünler
// vitrinde gizlensin mi. Bayrak vitrin önbelleğinde tutulduğu için
// kaydedince mağaza önbelleği tazelenir.
export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json().catch(() => null);

  if (typeof body?.hide_out_of_stock !== "boolean") {
    return NextResponse.json({ error: "hide_out_of_stock alanı zorunludur." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase
    .from("tenants")
    .update({ hide_out_of_stock: body.hide_out_of_stock })
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json({ error: "Stok görünürlüğü ayarı kaydedilemedi." }, { status: 400 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  return NextResponse.json({ hide_out_of_stock: body.hide_out_of_stock });
}
