// Siparişte toptancıya e-posta (14 Eki 2026). Ücretli planda + Ayarlar →
// E-posta Bildirimleri açıkken (tenants.order_email_enabled, 0173) her
// siparişte "Yeni sipariş" e-postası kayıtta verilen adrese (contact_email)
// gider. Diğer durumlarda eski davranış: yalnız ilk siparişte bir kez
// "İlk siparişiniz geldi". Sipariş akışını asla bloklamaz (after() içinden).
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import { sendEmail } from "@/lib/email/send";
import { buildNewOrderEmail, type NewOrderEmailParams } from "@/lib/email/templates/new-order";
import { appEnv } from "@/lib/env";
import { sendFirstOrderEmailIfNeeded } from "@/lib/signup/first-order-email";
import type { CartItem } from "@/lib/types";

/** Ücretli plan = reklamsız plan (yalnız "free" reklamlı; bkz. plans.ts ad_free). */
export function canReceiveOrderEmails(plan: TenantPlan) {
  return hasPlanFeature(plan, "ad_free");
}

export function orderEmailItems(items: CartItem[], catalog: boolean): NewOrderEmailParams["items"] {
  return items.map((item) => ({
    name: item.product_name,
    variantName: item.variant_name,
    code: item.sku_code || null,
    quantity: item.quantity,
    unitLabel: item.sales_unit ?? "adet",
    lineTotal: catalog || item.price === null ? null : Math.round(item.price * item.quantity * 100) / 100,
    imageUrl: item.image_url && /^https:\/\//.test(item.image_url) ? item.image_url : null,
    isGift: Boolean(item.is_gift),
  }));
}

export interface OrderEmailInput {
  orderNo: number | null;
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
  paymentLabel?: string | null;
  currency: string;
  items: CartItem[];
  totals: { label: string; amount: number }[];
  finalTotal: number;
}

export function orderEmailUrls() {
  return {
    ordersUrl: `https://${appEnv.appDomain}/siparisler`,
    settingsUrl: `https://${appEnv.appDomain}/settings/email`,
  };
}

export async function sendOrderEmail(supabase: SupabaseClient, tenantId: string, order: OrderEmailInput) {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("company_name, business_type, contact_email, plan, order_email_enabled, first_order_email_sent_at")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) return;

  const enabled = tenant.order_email_enabled !== false;
  if (!enabled) return;

  if (!tenant.contact_email || !canReceiveOrderEmails(tenant.plan as TenantPlan)) {
    // Ücretsiz plan (ya da adres yok): eski "ilk sipariş" e-postası, bir kez.
    await sendFirstOrderEmailIfNeeded(supabase, tenantId, {
      orderNumber: order.orderNumber,
      orderNo: order.orderNo,
      customerName: order.customerName,
      itemCount: order.items.length,
      totalAmount: order.finalTotal,
      currency: order.currency,
    });
    return;
  }

  // Her siparişte e-posta alan tenant'a ayrıca "ilk sipariş" gitmesin.
  if (!tenant.first_order_email_sent_at) {
    await supabase
      .from("tenants")
      .update({ first_order_email_sent_at: new Date().toISOString() })
      .eq("id", tenantId)
      .is("first_order_email_sent_at", null);
  }

  const mail = buildNewOrderEmail({
    businessName: tenant.company_name,
    businessType: tenant.business_type ?? null,
    orderNo: order.orderNo,
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    note: order.note,
    paymentLabel: order.paymentLabel,
    currency: order.currency,
    items: orderEmailItems(order.items, order.currency === "CATALOG"),
    totals: order.totals,
    finalTotal: order.finalTotal,
    ...orderEmailUrls(),
  });
  await sendEmail({ to: tenant.contact_email, ...mail });
}
