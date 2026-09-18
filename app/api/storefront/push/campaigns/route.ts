import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStorefrontTenant } from "@/lib/data";
import { readStorefrontPriceList } from "@/lib/storefront/session";

// Kampanya/duyuru bildirimi aboneliği (vitrin Kampanyalar paneli).
// Sipariş takibindeki aboneliğin aksine token yok: müşteri şifre kapısından
// geçmişse çerezdeki erişim kodu ve fiyat listesi kaydedilir; şifresiz
// mağazada yalnız tenant'a bağlanır. Böylece bayi "sadece 2. listedekilere"
// bildirim atabilir.
async function resolveContext(subdomainRaw: unknown) {
  const subdomain = String(subdomainRaw ?? "").trim().toLowerCase();
  if (!subdomain) return null;
  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant) return null;
  const cookie = await readStorefrontPriceList(subdomain);
  const sameTenant = cookie && cookie.tenantId === tenant.id;
  return {
    tenant,
    accessCodeId: sameTenant ? cookie.accessCodeId ?? null : null,
    priceListId: sameTenant && cookie.priceListId ? cookie.priceListId : null,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const ctx = await resolveContext(body?.subdomain);
  if (!ctx) return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  // order_id / customer_id bilerek gönderilmiyor: aynı cihaz takip
  // sayfasından da abone olduysa o bağ korunur, yalnız duyuru alanları yazılır.
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      tenant_id: ctx.tenant.id,
      kind: "campaign",
      access_code_id: ctx.accessCodeId,
      price_list_id: ctx.priceListId,
      endpoint: String(sub.endpoint),
      p256dh: String(sub.keys.p256dh),
      auth: String(sub.keys.auth),
      user_agent: typeof body.user_agent === "string" ? body.user_agent.slice(0, 300) : null,
      failure_count: 0,
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: "Abonelik kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Bu cihaz duyuruya kayıtlı mı? (Panel açılınca "Bildirimler açık" göstermek için.)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint") ?? "";
  const ctx = await resolveContext(url.searchParams.get("subdomain"));
  const supabase = createSupabaseAdminClient();
  if (!ctx || !endpoint || !supabase) return NextResponse.json({ subscribed: false });
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("tenant_id", ctx.tenant.id)
    .eq("endpoint", endpoint)
    .eq("kind", "campaign")
    .maybeSingle();
  return NextResponse.json({ subscribed: Boolean(data) }, { headers: { "Cache-Control": "no-store" } });
}

// Duyurudan çık: satır siparişe bağlıysa (order_id dolu) silinmez, yalnız
// kind 'order'a döner; değilse tamamen silinir.
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const ctx = await resolveContext(body?.subdomain);
  const supabase = createSupabaseAdminClient();
  if (!ctx || !endpoint || !supabase) return NextResponse.json({ ok: true });
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, order_id")
    .eq("tenant_id", ctx.tenant.id)
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (!data) return NextResponse.json({ ok: true });
  if (data.order_id) {
    await supabase.from("push_subscriptions").update({ kind: "order", access_code_id: null, price_list_id: null }).eq("id", data.id);
  } else {
    await supabase.from("push_subscriptions").delete().eq("id", data.id);
  }
  return NextResponse.json({ ok: true });
}
