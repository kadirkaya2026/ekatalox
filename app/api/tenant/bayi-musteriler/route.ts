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

// Başvurusuz bayi müşterisi ekleme (kişiye özel şifre). Yalnız Kurumsal paket.
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (!hasKurumsalSiteAccess(tenant)) {
    return NextResponse.json({ error: "Bu özellik Kurumsal pakette kullanılabilir." }, { status: 403 });
  }
  const parsed = dealerApproveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }
  const { data: list } = await supabase
    .from("price_lists")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("id", parsed.data.price_list_id)
    .maybeSingle();
  if (!list) return NextResponse.json({ error: "Fiyat listesi bulunamadı." }, { status: 400 });

  const { data, error } = await supabase
    .from("access_codes")
    .insert({ tenant_id: tenant.id, is_personal: true, ...parsed.data })
    .select("id")
    .single();
  if (error || !data) {
    if (isDuplicatePasswordError(error)) {
      return NextResponse.json({ error: DUPLICATE_PASSWORD_MESSAGE }, { status: 409 });
    }
    console.error("[bayi-musteri] eklenemedi:", error?.message);
    return NextResponse.json({ error: "Müşteri eklenemedi." }, { status: 500 });
  }
  return NextResponse.json({ success: true, accessCodeId: data.id });
}
