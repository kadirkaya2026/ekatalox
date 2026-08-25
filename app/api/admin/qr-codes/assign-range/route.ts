import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Aralık ataması: havuzdaki sahipsiz kodlardan N tanesini bir bayiye atar.
// İş RPC'de tek SQL ifadesiyle yapılır (bkz. 0089_magnet_admin_rpcs.sql);
// for update skip locked sayesinde iki admin aynı kodları paylaşamaz.

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id.trim() : "";
  const count = Math.floor(Number(body?.count ?? 0));
  const label = typeof body?.label === "string" ? body.label.trim() || null : null;

  if (!tenantId) {
    return NextResponse.json({ error: "Bayi seçilmedi." }, { status: 400 });
  }
  if (!Number.isFinite(count) || count < 1 || count > 5000) {
    return NextResponse.json(
      { error: "Bir seferde 1 ile 5000 arasında kod atayabilirsiniz." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("assign_free_magnet_codes", {
    p_tenant_id: tenantId,
    p_count: count,
    p_label: label,
  });

  if (error) {
    return NextResponse.json({ error: "Atama yapılamadı." }, { status: 500 });
  }

  const assigned = typeof data === "number" ? data : 0;

  // Havuzda istenen kadar sahipsiz kod olmayabilir; kaçının atandığını
  // açıkça söylüyoruz, arayüz eksik kalan sayıyı gösterir.
  return NextResponse.json({ assigned, requested: count });
}
