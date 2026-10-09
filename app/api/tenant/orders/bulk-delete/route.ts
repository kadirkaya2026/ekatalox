import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// İptal sekmesinde toplu silme (10 Eki 2026, Lucatech): seçilen siparişlerden yalnız
// İPTAL durumundakiler kalıcı silinir (tekli DELETE ile aynı kural).
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type === "market") {
    return NextResponse.json({ error: "Bu mağazada sipariş silme kapalı." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))]
    : [];
  if (!ids.length || ids.length > 200) {
    return NextResponse.json({ error: "Silinecek sipariş seçin (en fazla 200)." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("status", "cancelled")
    .in("id", ids)
    .select("id");
  if (error) {
    console.error("[orders] bulk delete failed:", error);
    return NextResponse.json({ error: "Siparişler silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ deleted: (data ?? []).length, skipped: ids.length - (data ?? []).length });
}
