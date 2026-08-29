import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantStorefrontSettings } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { sendCustomerPush } from "@/lib/push/send-customer-push";
import { formatCouponBenefit } from "@/lib/coupons/shared";

// Aktif kuponun bildirimini yeniden gönder (bayi istediği kadar; her seferinde
// isteğe bağlı yeni mesajla). Aynı tag → cihazda önceki bildirimin yerine geçer.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const couponId = typeof body?.coupon_id === "string" ? body.coupon_id : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 200) : "";
  const supabase = createSupabaseAdminClient();
  if (!supabase || !couponId) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { data: coupon } = await supabase
    .from("customer_coupons")
    .select("id, kind, value, currency, message, min_order_amount, expires_at, status, category_ids")
    .eq("tenant_id", tenant.id)
    .eq("customer_id", id)
    .eq("id", couponId)
    .maybeSingle();
  if (!coupon || coupon.status !== "active") return NextResponse.json({ error: "Aktif kupon bulunamadı." }, { status: 404 });

  if (message && message !== (coupon.message ?? "")) {
    await supabase.from("customer_coupons").update({ message }).eq("id", coupon.id);
  }

  const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
  const storeName = settings?.storefront_title?.trim() || tenant.company_name;
  const origin = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  const benefit = formatCouponBenefit({ kind: coupon.kind, value: Number(coupon.value), currency: coupon.currency });
  const conditions = [
    coupon.min_order_amount ? `${Number(coupon.min_order_amount).toLocaleString("tr-TR")} ₺ ve üzeri` : null,
    coupon.expires_at ? `son gün ${new Date(coupon.expires_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}` : null,
  ].filter(Boolean).join(" · ");
  const sent = await sendCustomerPush({
    tenantId: tenant.id,
    customerId: id,
    title: `${storeName} - Size Özel ${benefit} İndirim!`,
    body: message || coupon.message || (conditions ? `${conditions} · sepette kendiliğinden uygulanır.` : "Sepette kendiliğinden uygulanır."),
    url: `${origin}/?kampanya=1`,
    iconUrl: settings?.logo_url || settings?.site_favicon_url || null,
    tag: `coupon-${coupon.id}`,
  });
  return NextResponse.json({ ok: true, sent });
}
