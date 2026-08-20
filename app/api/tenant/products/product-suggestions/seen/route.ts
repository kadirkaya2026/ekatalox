import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Bildirim zilinde liste sonuna kadar kaydırıldığında çağrılır: onaylanmış,
// henüz kapatılmamış ve henüz görülmemiş bildirimler "görüldü" işaretlenir.
// Menüdeki kırmızı sayaç seen_at'i saydığı için sıfırlanır, bildirimler
// zilde durmaya devam eder — kapatma (dismissed_at) ayrı bir işlem.
export async function POST() {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase
    .from("product_suggestions")
    .update({ seen_at: new Date().toISOString() })
    .eq("tenant_id", tenant.id)
    .eq("status", "approved")
    .is("dismissed_at", null)
    .is("seen_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
