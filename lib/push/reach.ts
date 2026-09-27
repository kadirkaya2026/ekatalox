import type { SupabaseClient } from "@supabase/supabase-js";

// Panelde "bildirimi açık" işareti (27 Eyl 2026): bir müşteriye/siparişe
// bildirim ulaşabilir mi? Abonelik şunlardan biriyle eşleşirse evet:
// müşteri kaydı (customer_id), siparişin kendi takip aboneliği (order_id),
// KİŞİYE ÖZEL bayi şifresi (access_code_id; ortak liste şifresi kimlik
// değildir, sayılmaz) ya da abonelikte yazılan telefon.

export interface PushReach {
  customerIds: Set<string>;
  orderIds: Set<string>;
  personalCodeIds: Set<string>;
  phones: Set<string>;
}

/** Telefon karşılaştırma anahtarı: son 10 hane (0/90/+90 farkı yok sayılır). */
export function phoneReachKey(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function getPushReach(supabase: SupabaseClient, tenantId: string): Promise<PushReach> {
  const reach: PushReach = { customerIds: new Set(), orderIds: new Set(), personalCodeIds: new Set(), phones: new Set() };
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("customer_id, order_id, access_code_id, subscriber_phone")
    .eq("tenant_id", tenantId)
    .lt("failure_count", 5);
  if (error || !data) return reach;

  const codeIds = new Set<string>();
  for (const row of data) {
    if (row.customer_id) reach.customerIds.add(row.customer_id);
    if (row.order_id) reach.orderIds.add(row.order_id);
    if (row.access_code_id) codeIds.add(row.access_code_id);
    const key = phoneReachKey(row.subscriber_phone);
    if (key) reach.phones.add(key);
  }
  if (codeIds.size) {
    const { data: codes } = await supabase
      .from("access_codes")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("is_personal", true)
      .in("id", [...codeIds]);
    for (const code of codes ?? []) reach.personalCodeIds.add(code.id);
  }
  return reach;
}

export function hasPushReach(
  reach: PushReach,
  target: {
    customerId?: string | null;
    orderId?: string | null;
    accessCodeId?: string | null;
    phone?: string | null;
  },
) {
  if (target.customerId && reach.customerIds.has(target.customerId)) return true;
  if (target.orderId && reach.orderIds.has(target.orderId)) return true;
  if (target.accessCodeId && reach.personalCodeIds.has(target.accessCodeId)) return true;
  const key = phoneReachKey(target.phone);
  return Boolean(key && reach.phones.has(key));
}
