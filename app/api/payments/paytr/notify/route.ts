import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadTenantPaymentProvider } from "@/lib/payments/credentials";
import { verifyPaytrNotification } from "@/lib/payments/gateway";
import { findAttemptByReference, settlePaymentAttempt } from "@/lib/payments/order-payments";

// PayTR "Bildirim URL" (0185). Mağaza bu adresi kendi PayTR panelinde
// (Destek & Kurulum → Ayarlar → Bildirim URL) tanımlar. PayTR sunucusu her
// ödeme sonucunu buraya POST eder; imza mağazanın anahtarıyla doğrulanır ve
// yanıt düz "OK" olmalıdır, yoksa PayTR tekrar dener.
function ok() {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return new Response("BAD_REQUEST", { status: 400 });
  const fields = Object.fromEntries(
    [...form.entries()].map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  ) as Record<string, string>;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return new Response("SERVER_ERROR", { status: 500 });

  const attempt = fields.merchant_oid ? await findAttemptByReference(supabase, fields.merchant_oid) : null;
  // Bilinmeyen sipariş (ör. aynı PayTR hesabının başka bir sitesi): tekrar
  // denemesin diye OK; işlem yapılmaz.
  if (!attempt || attempt.provider !== "paytr") return ok();

  const provider = await loadTenantPaymentProvider(supabase, attempt.tenant_id);
  if (!provider || provider.provider !== "paytr" || !verifyPaytrNotification(provider.credentials, fields)) {
    console.error("[paytr-notify] imza doğrulanamadı", { reference: attempt.reference });
    return new Response("PAYTR notification failed: bad hash", { status: 400 });
  }

  if (fields.status === "success") {
    const paid = Number(fields.payment_amount || fields.total_amount || 0) / 100;
    await settlePaymentAttempt(
      supabase,
      attempt,
      paid + 0.01 >= Number(attempt.amount)
        ? { paid: true, amount: Number(fields.total_amount || 0) / 100 || paid }
        : { paid: false, error: "Ödeme tutarı siparişle eşleşmedi." },
    );
  } else {
    const reason = [fields.failed_reason_code, fields.failed_reason_msg].filter(Boolean).join(" - ");
    await settlePaymentAttempt(supabase, attempt, { paid: false, error: reason || "Ödeme tamamlanmadı." });
  }
  return ok();
}
