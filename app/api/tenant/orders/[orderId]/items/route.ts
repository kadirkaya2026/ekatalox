import { NextResponse } from "next/server";
import type { StorefrontOrder } from "@/lib/types";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantOrderWithEvents } from "@/lib/orders/data";
import { orderItemsPatchSchema } from "@/lib/validators/orders";
import { ORDER_EDITABLE_STATUSES, ORDER_EDIT_EVENT_PREFIX } from "@/lib/orders/status";

// Sipariş fişindeki adetlerin düzeltilmesi (0151). Yalnız
// tenants.order_edit_enabled açık tenantlarda; kural ve hesap veritabanındaki
// update_order_items içinde tek transaction, burada doğrulama + olay metni.
export async function PATCH(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (!tenant.order_edit_enabled) {
    return NextResponse.json({ error: "Bu mağazada sipariş fişi düzenleme kapalı." }, { status: 403 });
  }
  const { orderId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = orderItemsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz istek." }, { status: 400 });
  }

  const current = await getTenantOrderWithEvents(tenant.id, orderId);
  if (!current) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  const order = current.order;
  if (!ORDER_EDITABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: "Yola çıkmış, teslim edilmiş veya iptal edilmiş sipariş düzenlenemez." }, { status: 409 });
  }
  const quantities = parsed.data.quantities;
  if (quantities.length !== order.items.length) {
    return NextResponse.json({ error: "Sipariş bu arada değişmiş; sayfayı yenileyip tekrar deneyin." }, { status: 409 });
  }

  // Olay metni: değişen satırlar (panelde fişin altında görünür).
  const changes: string[] = [];
  order.items.forEach((item, i) => {
    const q = quantities[i];
    if (q === item.quantity) return;
    const ad = item.product_name + (item.variant_name ? ` (${item.variant_name})` : "");
    changes.push(q === 0 ? `${ad}: çıkarıldı` : `${ad}: ${item.quantity} → ${q}`);
  });
  if (changes.length === 0) {
    return NextResponse.json({ error: "Değişiklik yok." }, { status: 400 });
  }
  if (quantities.every((q) => q === 0)) {
    return NextResponse.json({ error: "Fişte en az bir ürün kalmalı; tamamını kaldırmak için siparişi iptal edin." }, { status: 400 });
  }
  const reason = `${ORDER_EDIT_EVENT_PREFIX} ${changes.join("; ")}`;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }
  const { data, error } = await supabase.rpc("update_order_items", {
    p_tenant_id: tenant.id,
    p_order_id: orderId,
    p_quantities: quantities,
    p_actor_profile_id: session.profile?.id ?? null,
    p_reason: reason,
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("order_not_found")) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    if (msg.includes("order_edit_disabled")) return NextResponse.json({ error: "Bu mağazada sipariş fişi düzenleme kapalı." }, { status: 403 });
    if (msg.includes("order_not_editable")) {
      return NextResponse.json({ error: "Yola çıkmış, teslim edilmiş veya iptal edilmiş sipariş düzenlenemez." }, { status: 409 });
    }
    if (msg.includes("quantities_mismatch")) {
      return NextResponse.json({ error: "Sipariş bu arada değişmiş; sayfayı yenileyip tekrar deneyin." }, { status: 409 });
    }
    if (msg.includes("no_items_left") || msg.includes("invalid_quantity")) {
      return NextResponse.json({ error: "Adetler geçersiz; fişte en az bir ürün kalmalı." }, { status: 400 });
    }
    console.error("[orders] update_order_items failed:", error);
    return NextResponse.json({ error: "Fiş güncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ order: data as StorefrontOrder, changes });
}
