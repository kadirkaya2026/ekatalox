import { NextResponse, after } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import { formatOrderNo } from "@/lib/orders/format";
import { sendOrderStatusPush } from "@/lib/push/send-order-status-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import type { StorefrontOrder } from "@/lib/types";

// Toplu iptal (10 Eki 2026, Lucatech): Tümü/Yeni sekmesinde seçilen siparişler tek
// tek transition_order_status ile iptale alınır (kural, stok iadesi, olay kaydı DB'de).
// Geçişi olmayanlar (teslim edilmiş, zaten iptal) atlanır. Bayiye iptal bildirimi gider.
const REASON = "Panelden iptal edildi";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type === "market") {
    return NextResponse.json({ error: "Bu mağazada toplu iptal kapalı." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))]
    : [];
  if (!ids.length || ids.length > 200) {
    return NextResponse.json({ error: "İptal edilecek sipariş seçin (en fazla 200)." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const cancelled: StorefrontOrder[] = [];
  let skipped = 0;
  for (const id of ids) {
    const { data, error } = await supabase.rpc("transition_order_status", {
      p_tenant_id: tenant.id,
      p_order_id: id,
      p_to_status: "cancelled",
      p_reason: REASON,
      p_actor: "dealer",
      p_actor_profile_id: session.profile?.id ?? null,
    });
    if (error || !data) skipped += 1;
    else cancelled.push(data as StorefrontOrder);
  }

  if (cancelled.length) {
    const origin = tenant.custom_domain?.trim()
      ? `https://${tenant.custom_domain.trim()}`
      : `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ekatalox.com"}`;
    after(async () => {
      const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
      for (const order of cancelled) {
        await sendOrderStatusPush({
          tenantId: tenant.id,
          orderId: order.id,
          customerId: order.customer_id,
          accessCodeId: order.access_code_id ?? null,
          customerPhone: order.customer_phone,
          orderNo: formatOrderNo(order),
          status: order.status,
          tenantName: settings?.storefront_title?.trim() || tenant.company_name,
          isTekel: Boolean(tenant.is_tekel),
          isWholesale: true,
          iconUrl: settings?.logo_url || settings?.site_favicon_url || null,
          trackingUrl: order.tracking_token ? `${origin}/siparis/${order.tracking_token}` : null,
        }).catch((err) => console.error("[push] toplu iptal bildirimi:", err));
      }
    });
  }
  return NextResponse.json({ cancelled: cancelled.length, skipped });
}
