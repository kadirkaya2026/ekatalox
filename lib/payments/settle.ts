import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTenantPaymentProvider } from "@/lib/payments/credentials";
import { retrieveIyzicoPayment, retrievePaynetPayment } from "@/lib/payments/gateway";
import { settlePaymentAttempt, type PaymentAttempt } from "@/lib/payments/order-payments";

// Sağlayıcıdan doğrulanmış sonucu denemeye işleyen ortak adımlar (0185).
// Tutar denetimi: sağlayıcının tahsil ettiği tutar denemedeki tutardan az
// olamaz (taksit farkı müşteriye yansıtıldıysa fazla olabilir).
function amountCovers(attempt: PaymentAttempt, paid: number) {
  return paid + 0.01 >= Number(attempt.amount);
}

export async function settleIyzicoToken(supabase: SupabaseClient, attempt: PaymentAttempt, token: string) {
  const provider = await loadTenantPaymentProvider(supabase, attempt.tenant_id);
  if (!provider || provider.provider !== "iyzico") return attempt.status;
  const result = await retrieveIyzicoPayment(provider.credentials, provider.isTest, token);
  if (result.status === "pending") return "pending" as const;
  if (result.status === "failed") return settlePaymentAttempt(supabase, attempt, { paid: false, error: result.error });
  if (result.reference !== attempt.reference || !amountCovers(attempt, result.amount)) {
    return settlePaymentAttempt(supabase, attempt, { paid: false, error: "Ödeme sipariş bilgileriyle eşleşmedi." });
  }
  return settlePaymentAttempt(supabase, attempt, { paid: true, amount: result.amount });
}

export async function settlePaynetAttempt(supabase: SupabaseClient, attempt: PaymentAttempt) {
  const provider = await loadTenantPaymentProvider(supabase, attempt.tenant_id);
  if (!provider || provider.provider !== "paynet") return attempt.status;
  const result = await retrievePaynetPayment(provider.credentials, provider.isTest, attempt.reference);
  if (result.status === "pending") return "pending" as const;
  if (result.status === "failed") return settlePaymentAttempt(supabase, attempt, { paid: false, error: result.error });
  if (!amountCovers(attempt, result.amount)) {
    return settlePaymentAttempt(supabase, attempt, { paid: false, error: "Ödeme tutarı siparişle eşleşmedi." });
  }
  return settlePaymentAttempt(supabase, attempt, { paid: true, amount: result.amount });
}
