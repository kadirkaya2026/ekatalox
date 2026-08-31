import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Paket ataması: bir baskı paketinin (A01..J10, 100'lük fiziksel kutu)
// SAHİPSİZ kodlarının tamamını tek çağrıyla bir bayiye verir.
// İş RPC'de tek SQL ifadesiyle yapılır (bkz. 0101_magnet_package_backfill.sql);
// for update skip locked sayesinde iki admin aynı kodları paylaşamaz.

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id.trim() : "";
  const packageCode =
    typeof body?.package_code === "string" ? body.package_code.trim().toUpperCase() : "";

  if (!tenantId) {
    return NextResponse.json({ error: "Bayi seçilmedi." }, { status: 400 });
  }
  if (!/^[A-J]\d{2}$/.test(packageCode)) {
    return NextResponse.json({ error: "Geçersiz paket kodu." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("assign_magnet_package", {
    p_tenant_id: tenantId,
    p_package_code: packageCode,
  });

  if (error) {
    return NextResponse.json({ error: "Atama yapılamadı." }, { status: 500 });
  }

  // Paketten daha önce tek tek atanmış kod varsa sayı 100'den az döner;
  // arayüz bunu açıkça söyler.
  return NextResponse.json({ assigned: typeof data === "number" ? data : 0 });
}
