import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ayarlar → Sipariş Fişi (28 Eyl 2026): fişte ürün görseli olsun mu.
// generate-pdf bu değeri her siparişte doğrudan veritabanından okur;
// vitrin önbelleğine girmediği için yeniden doğrulama gerekmez.
export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json().catch(() => null);

  if (typeof body?.receipt_show_images !== "boolean") {
    return NextResponse.json({ error: "receipt_show_images alanı zorunludur." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase
    .from("tenants")
    .update({ receipt_show_images: body.receipt_show_images })
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json({ error: "Sipariş fişi ayarı kaydedilemedi." }, { status: 400 });
  }

  return NextResponse.json({ receipt_show_images: body.receipt_show_images });
}
