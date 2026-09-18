import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getTenantStorefrontSettings } from "@/lib/data";
import {
  countTenantBroadcastSubscribers,
  getTenantStorefrontOrigin,
  sendTenantBroadcastPush,
} from "@/lib/push/send-tenant-broadcast-push";

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
  const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 200) : "/?kampanya=1";
  const subscriptionIds = Array.isArray(body?.subscription_ids)
    ? (body.subscription_ids as unknown[]).filter((v): v is string => typeof v === "string").slice(0, 500)
    : null;
  if (!title) return NextResponse.json({ error: "Başlık zorunludur." }, { status: 400 });

  const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
  const sent = await sendTenantBroadcastPush({
    tenantId: tenant.id,
    title,
    body: text,
    url: `${getTenantStorefrontOrigin(tenant)}${path}`,
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
