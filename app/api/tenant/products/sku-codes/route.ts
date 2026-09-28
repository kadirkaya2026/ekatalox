import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Toplu görsel eşleştirme önizlemesi için tenant'ın tüm Model No'ları
// (sayfalı; PostgREST sayfa başına 1000 satır döner). 28 Eyl 2026.
export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ skuCodes: [] });
  }

  const skuCodes: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("products")
      .select("sku_code")
      .eq("tenant_id", tenant.id)
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      return NextResponse.json({ error: "Ürün kodları okunamadı." }, { status: 500 });
    }
    skuCodes.push(...((data ?? []) as Array<{ sku_code: string }>).map((row) => row.sku_code));
    if (!data || data.length < 1000) break;
  }

  return NextResponse.json({ skuCodes });
}
