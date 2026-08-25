import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Bayinin kendi magneti üzerinde iki işlem:
//  - is_disabled: pasife al / geri aç (süper adminin kapattığını da açabilir;
//    kayıtta kimin kapattığı durur — bkz. 0087 disabled_by_role)
//  - customer_id: sahiplenen müşteriyi değiştir ya da null ile sıfırla.
//    Sessiz sahiplenme yanlış kişiyi işaretleyebilir (ev telefonu, arkadaşın
//    cihazı); düzeltme yetkisi bayide.
//
// Her sorgu .eq("tenant_id", ...) ile sınırlı: başka bayinin magneti bu uçtan
// hiçbir koşulda değişemez.

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  const guncelleme: Record<string, unknown> = {};

  if (typeof body?.is_disabled === "boolean") {
    guncelleme.is_disabled = body.is_disabled;
    guncelleme.disabled_at = body.is_disabled ? new Date().toISOString() : null;
    guncelleme.disabled_by_role = body.is_disabled ? "tenant_admin" : null;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "customer_id")) {
    const customerId =
      typeof body.customer_id === "string" && body.customer_id.trim()
        ? body.customer_id.trim()
        : null;

    if (customerId) {
      // Bileşik FK (0087) zaten çapraz tenant'ı imkânsız kılıyor; yine de
      // burada doğrulayıp anlaşılır bir hata dönüyoruz.
      const supabase = createSupabaseAdminClient();
      if (!supabase) {
        return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
      }
      const { data: musteri } = await supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("id", customerId)
        .maybeSingle();
      if (!musteri) {
        return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 400 });
      }
      guncelleme.customer_id = customerId;
      guncelleme.claimed_at = new Date().toISOString();
    } else {
      // Sıfırlama: bir SONRAKİ sipariş magneti yeniden sahiplenebilsin diye
      // first_order_id de temizlenir.
      guncelleme.customer_id = null;
      guncelleme.claimed_at = null;
      guncelleme.first_order_id = null;
    }
  }

  if (!Object.keys(guncelleme).length) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .update(guncelleme)
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Magnet güncellenemedi." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Magnet bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
