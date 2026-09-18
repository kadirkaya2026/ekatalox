import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getTenantStorefrontSettings } from "@/lib/data";
import {
  countTenantBroadcastSubscribers,
  getTenantStorefrontOrigin,
  sendTenantBroadcastPush,
  type PushTarget,
} from "@/lib/push/send-tenant-broadcast-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hedef ürün/kategori bu bayiye ait mi? (Başka bayinin id'si linke girmesin.)
// Görseli de döner: ürün fotoğrafı / kategori kutucuk görseli bildirimde
// büyük görsel olarak çıkar (Android).
async function resolveTarget(
  tenantId: string,
  raw: unknown,
): Promise<{ target: PushTarget; imageUrl: string | null } | null> {
  const type = typeof (raw as { type?: unknown })?.type === "string" ? (raw as { type: string }).type : "campaigns";
  const id = typeof (raw as { id?: unknown })?.id === "string" ? (raw as { id: string }).id : "";
  if (type === "campaigns") return { target: { type: "campaigns" }, imageUrl: null };
  if ((type !== "category" && type !== "product") || !UUID.test(id)) return null;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  if (type === "product") {
    const { data } = await supabase.from("products").select("id, image_url").eq("tenant_id", tenantId).eq("id", id).maybeSingle();
    return data ? { target: { type, id }, imageUrl: data.image_url ?? null } : null;
  }
  const { data } = await supabase.from("categories").select("id, tile_image_url").eq("tenant_id", tenantId).eq("id", id).maybeSingle();
  return data ? { target: { type, id }, imageUrl: data.tile_image_url ?? null } : null;
}

// Serbest duyuru: "Yeni ürün geldi", "Stok azalıyor" gibi. Başlık + metin,
// isteğe bağlı fiyat listesi filtresi (yalnız o şifreyle girenler alır).
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 200) : "";
  const priceListId = typeof body?.price_list_id === "string" && body.price_list_id ? body.price_list_id : null;
  const resolved = await resolveTarget(tenant.id, body?.target);
  if (!resolved) return NextResponse.json({ error: "Hedef ürün/kategori bulunamadı." }, { status: 400 });
  const { target, imageUrl } = resolved;
  const subscriptionIds = Array.isArray(body?.subscription_ids)
    ? (body.subscription_ids as unknown[]).filter((v): v is string => typeof v === "string").slice(0, 500)
    : null;
  if (!title) return NextResponse.json({ error: "Başlık zorunludur." }, { status: 400 });

  const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
  const sent = await sendTenantBroadcastPush({
    tenantId: tenant.id,
    title,
    body: text,
    origin: getTenantStorefrontOrigin(tenant),
    target,
    imageUrl,
    iconUrl: settings?.logo_url || settings?.site_favicon_url || null,
    priceListId,
    subscriptionIds,
  });
  return NextResponse.json({ ok: true, sent });
}

// Abone sayısı (panelde "N cihaz bildirim alıyor" için).
export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const url = new URL(request.url);
  const priceListId = url.searchParams.get("price_list_id");
  const count = await countTenantBroadcastSubscribers(session.tenant!.id, priceListId);
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
