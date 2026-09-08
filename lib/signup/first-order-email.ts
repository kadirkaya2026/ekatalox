// "İlk siparişiniz geldi" e-postası: tenant'a bir kez, kayıtta verilen
// iletişim adresine. Sipariş akışını asla bloklamaz (after() içinden çağrılır).
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { buildFirstOrderEmail } from "@/lib/email/templates/first-order";
import { appEnv } from "@/lib/env";

export async function sendFirstOrderEmailIfNeeded(
  supabase: SupabaseClient,
  tenantId: string,
  order: { orderNumber: string; orderNo: number | null; customerName: string; itemCount: number; totalAmount: number; currency: string },
) {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("company_name, contact_email, contact_full_name, first_order_email_sent_at")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant?.contact_email || tenant.first_order_email_sent_at) return;

  const { error } = await supabase
    .from("tenants")
    .update({ first_order_email_sent_at: new Date().toISOString() })
    .eq("id", tenantId)
    .is("first_order_email_sent_at", null);
  if (error) return;

  const mail = buildFirstOrderEmail({
    businessName: tenant.company_name,
    contactName: tenant.contact_full_name ?? null,
    orderNumber: order.orderNumber,
    orderNo: order.orderNo,
    customerName: order.customerName,
    itemCount: order.itemCount,
    totalAmount: order.totalAmount,
    currency: order.currency,
    ordersUrl: `https://${appEnv.appDomain}/siparisler`,
  });
  await sendEmail({ to: tenant.contact_email, ...mail });
}
