import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ürünler sayfasındaki "N ürün onaylandı ve eklendi" bildirim banner'ı
// kapatıldığında, o tenant için onaylanmış+henüz kapatılmamış tüm öneriler
// tek seferde "görüldü" işaretlenir.
//
// Bildirim zilinden (suggestion-notification-bell.tsx) tek bir bildirime
// tıklandığında ise gövdede { suggestionId } gelir ve sadece o öneri
// kapatılır — diğerleri zilde durmaya devam etmeli.
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { suggestionId?: unknown } | null;
  const suggestionId =
    typeof body?.suggestionId === "string" && body.suggestionId.trim()
      ? body.suggestionId.trim()
      : null;

  let query = supabase
    .from("product_suggestions")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("tenant_id", tenant.id)
    .eq("status", "approved")
    .is("dismissed_at", null);

  if (suggestionId) {
    query = query.eq("id", suggestionId);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
