import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import {
  DUPLICATE_PASSWORD_MESSAGE,
  dealerApproveSchema,
  isDuplicatePasswordError,
} from "@/lib/kurumsal/dealer-customers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Bayi başvurusunu onaylar: seçilen fiyat listesine bağlı KİŞİYE ÖZEL şifre
// (access_codes, is_personal) oluşturur, başvuruyu "Onaylandı" yapar.
// Yalnız Kurumsal paket. Şifre mağazada benzersizdir (unique index).
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tenant/kurumsal/basvurular/[id]/onayla">,
) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (!hasKurumsalSiteAccess(tenant)) {
    return NextResponse.json({ error: "Bu özellik Kurumsal pakette kullanılabilir." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  }

  const parsed = dealerApproveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const [{ data: application }, { data: priceList }] = await Promise.all([
    supabase
      .from("dealer_applications")
      .select("id, status, access_code_id")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("price_lists")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("id", parsed.data.price_list_id)
      .maybeSingle(),
  ]);
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  }
  if (application.access_code_id) {
    return NextResponse.json({ error: "Bu başvuru zaten onaylanmış." }, { status: 409 });
  }
  if (!priceList) {
    return NextResponse.json({ error: "Fiyat listesi bulunamadı." }, { status: 400 });
  }

  const { password_code, price_list_id, ...info } = parsed.data;
  const { data: code, error } = await supabase
    .from("access_codes")
    .insert({
      tenant_id: tenant.id,
      password_code,
      price_list_id,
      is_personal: true,
      dealer_application_id: id,
      customer_company: info.customer_company ?? null,
      customer_name: info.customer_name,
      customer_phone: info.customer_phone ?? null,
      customer_address: info.customer_address ?? null,
      customer_city: info.customer_city ?? null,
      customer_note: info.customer_note ?? null,
    })
    .select("id")
    .single();

  if (error || !code) {
    if (isDuplicatePasswordError(error)) {
      return NextResponse.json({ error: DUPLICATE_PASSWORD_MESSAGE }, { status: 409 });
    }
    console.error("[bayi-musteri] şifre oluşturulamadı:", error?.message);
    return NextResponse.json({ error: "Şifre oluşturulamadı." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("dealer_applications")
    .update({ status: "approved", access_code_id: code.id, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenant.id)
    .eq("id", id);
  if (updateError) {
    console.error("[bayi-musteri] başvuru güncellenemedi:", updateError.message);
  }

  return NextResponse.json({ success: true, accessCodeId: code.id });
}
