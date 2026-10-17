import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendDealerOrderPush } from "@/lib/push/send-dealer-push";
import { sendOrderToBizimHesap } from "@/lib/integrations/bizimhesap";
import type { PaymentProvider } from "@/lib/payments/providers";
import { regeneratePaidReceipt } from "@/lib/payments/paid-receipt";

// Online ödeme denemeleri (0185, order_payment_attempts). Her "Öde" bir
// deneme satırı açar; sağlayıcının bildirimi (callback) referansla denemeyi
// bulur ve sonucu hem denemeye hem siparişe işler. İşlem idempotent:
// sağlayıcı aynı bildirimi birkaç kez gönderebilir.

export interface PaymentAttempt {
  id: string;
  tenant_id: string;
  order_id: string;
  provider: PaymentProvider;
  reference: string;
  provider_token: string | null;
  amount: number;
  status: "pending" | "paid" | "failed";
  error: string | null;
}

/** Sağlayıcıya giden sipariş kimliği. PayTR yalnız harf+rakam kabul eder. */
export function buildPaymentReference(orderNo: number | null) {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `EK${orderNo ?? 0}T${Date.now().toString(36).toUpperCase()}${random}`;
}

export async function createPaymentAttempt(
  supabase: SupabaseClient,
  params: { tenantId: string; orderId: string; provider: PaymentProvider; reference: string; amount: number },
) {
  const { data, error } = await supabase
    .from("order_payment_attempts")
    .insert({
      tenant_id: params.tenantId,
      order_id: params.orderId,
      provider: params.provider,
      reference: params.reference,
      amount: params.amount,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error("Ödeme denemesi kaydedilemedi.");
  return data as PaymentAttempt;
}

export async function setAttemptProviderToken(supabase: SupabaseClient, attemptId: string, token: string) {
  await supabase.from("order_payment_attempts").update({ provider_token: token }).eq("id", attemptId);
}

export async function findAttemptByReference(supabase: SupabaseClient, reference: string) {
  const { data } = await supabase.from("order_payment_attempts").select("*").eq("reference", reference).maybeSingle();
  return (data as PaymentAttempt | null) ?? null;
}

/**
 * Doğrulanmış sağlayıcı sonucunu işler. Ödeme başarılıysa sipariş "paid" olur,
 * bayiye "Ödeme alındı" bildirimi gider ve BizimHesap'a belge (bağlıysa)
 * o an gönderilir. Başarısızsa sipariş başka bir başarılı deneme yoksa
 * "failed" olur; müşteri ödeme sayfasından yeniden deneyebilir.
 */
export async function settlePaymentAttempt(
  supabase: SupabaseClient,
  attempt: PaymentAttempt,
  result: { paid: true; amount: number } | { paid: false; error: string },
) {
  if (attempt.status !== "pending") return attempt.status;
  const now = new Date().toISOString();

  if (!result.paid) {
    await supabase
      .from("order_payment_attempts")
      .update({ status: "failed", error: result.error.slice(0, 500), completed_at: now })
      .eq("id", attempt.id)
      .eq("status", "pending");
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", attempt.order_id)
      .eq("payment_status", "awaiting");
    return "failed" as const;
  }

  const { data: claimed } = await supabase
    .from("order_payment_attempts")
    .update({ status: "paid", error: null, completed_at: now })
    .eq("id", attempt.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  // Başka bir istek bu denemeyi az önce işledi.
  if (!claimed) return "paid" as const;

  const { data: order } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_method: "online",
      payment_provider: attempt.provider,
      paid_amount: result.amount,
      paid_at: now,
    })
    .eq("id", attempt.order_id)
    .in("payment_status", ["awaiting", "failed"])
    .select("id, tenant_id, order_no, customer_name, item_count, total_amount, currency")
    .maybeSingle();

  if (order) {
    await Promise.allSettled([
      sendDealerOrderPush({
        tenantId: order.tenant_id as string,
        kind: "paid",
        order: {
          id: order.id as string,
          orderNo: (order.order_no as number | null) ?? null,
          customerName: (order.customer_name as string) ?? "",
          itemCount: (order.item_count as number) ?? 0,
          totalAmount: Number(order.total_amount ?? 0),
          currency: order.currency as string,
          paymentMethod: "online",
        },
      }),
      sendOrderToBizimHesap(supabase, order.id as string),
      regeneratePaidReceipt(supabase, order.id as string).catch((error) =>
        console.error("[online-payment] ödendi fişi üretilemedi", { orderId: order.id, error: String(error) }),
      ),
    ]);
  }
  return "paid" as const;
}
