import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Paket ataması: bir veya birden fazla baskı paketinin (A01..J10, 100'lük
// fiziksel kutu) SAHİPSİZ kodlarının tamamını tek çağrıyla bir bayiye verir.
// İş RPC'de tek SQL ifadesiyle yapılır (0101 tekli, 0109 çoklu);
// for update skip locked sayesinde iki admin aynı kodları paylaşamaz.
// Başka bayiye atanmış kodlara DOKUNMAZ — panel atamadan önce
// /package-preview ile uyarı gösterir.

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id.trim() : "";

  // Tekli (package_code) VEYA çoklu (package_codes[]) — ikisi de normalize edilip
  // birleştiriliyor.
  const raw: string[] = [];
  if (typeof body?.package_code === "string") raw.push(body.package_code);
  if (Array.isArray(body?.package_codes)) {
    for (const p of body.package_codes) if (typeof p === "string") raw.push(p);
  }
  const packageCodes = [
    ...new Set(raw.map((p) => p.trim().toUpperCase()).filter((p) => /^[A-J]\d{2}$/.test(p))),
  ];

  if (!tenantId) {
    return NextResponse.json({ error: "Bayi seçilmedi." }, { status: 400 });
  }
  if (!packageCodes.length) {
    return NextResponse.json({ error: "Geçerli paket kodu yok." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("assign_magnet_packages", {
    p_tenant_id: tenantId,
    p_package_codes: packageCodes,
  });

  if (error) {
    return NextResponse.json({ error: "Atama yapılamadı." }, { status: 500 });
  }

  // Paketlerden daha önce başka bayiye atanmış kod varsa toplam beklenenden
  // az döner; arayüz bunu açıkça söyler.
  return NextResponse.json({
    assigned: typeof data === "number" ? data : 0,
    packages: packageCodes,
  });
}
