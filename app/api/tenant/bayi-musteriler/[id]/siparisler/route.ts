import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Bayi müşterisinin (kişiye özel şifre) siparişleri — Müşteriler sayfasında
// karta tıklayınca açılan liste. Eşleşme orders.access_code_id (0138).
export async function GET(_request: Request, ctx: RouteContext<"/api/tenant/bayi-musteriler/[id]/siparisler">) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (!hasKurumsalSiteAccess(tenant)) {
    return NextResponse.json({ error: "Bu özellik Kurumsal pakette kullanılabilir." }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_no, order_number, status, created_at, currency, total_amount, item_count")
    .eq("tenant_id", tenant.id)
    .eq("access_code_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[bayi-musteri] siparişler okunamadı:", error.message);
    return NextResponse.json({ error: "Siparişler okunamadı." }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [] });
}
