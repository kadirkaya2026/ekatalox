import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Müşteri kaydını siler. Siparişler SİLİNMEZ (customer_id null olur, Siparişler
// sayfasında durur); magnet sahipliği ve push abonelikleri çözülür, kuponları
// silinir. Aynı telefonla yeni sipariş gelirse müşteri sıfırdan oluşur.
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { data, error } = await supabase
    .from("customers")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[customers] delete failed:", error);
    return NextResponse.json({ error: "Müşteri silinemedi." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
