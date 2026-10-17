import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";
import { getClientIp } from "@/lib/storefront/client-ip";
import { getPublicOrigin } from "@/lib/tenancy/request-host";
import { loadTenantPaymentProvider } from "@/lib/payments/credentials";
import { startProviderPayment } from "@/lib/payments/gateway";
import { getOnlinePaymentProblems } from "@/lib/payments/readiness";
import { isValidTcKimlik, normalizeTcKimlik } from "@/lib/payments/identity";
import {
  buildPaymentReference,
  createPaymentAttempt,
  setAttemptProviderToken,
} from "@/lib/payments/order-payments";

// Ödeme sayfasındaki "Ödemeye geç" (0185): sipariş zaten kayıtlı (generate-pdf,
// payment_status=awaiting). Tutar SUNUCUDAKİ siparişten okunur; istemciden
// yalnız takip token'ı ve makbuz e-postası gelir.
const bodySchema = z.object({
  subdomain: z.string().trim().min(1).max(80),
  token: z.string().uuid(),
  email: z.string().trim().email().max(100),
  // Saklanmaz; yalnız ödeme kuruluşuna iletilir.
  identity_number: z.string().trim().max(20),
});

const MAX_ATTEMPTS_PER_ORDER = 15;

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (!isValidTcKimlik(parsed.data.identity_number)) {
    return NextResponse.json({ error: "T.C. kimlik numarası geçersiz." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  const tenant = await getStorefrontTenant(parsed.data.subdomain);
  if (!supabase || !tenant || tenant.status !== "active") {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, tenant_id, order_no, customer_name, customer_phone, customer_address, total_amount, currency, payment_method, payment_status, status")
    .eq("tracking_token", parsed.data.token)
    .maybeSingle();
  if (!order || order.tenant_id !== tenant.id || order.payment_method !== "online") {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ status: "paid" });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Bu sipariş iptal edilmiş." }, { status: 409 });
  }
  if (order.currency !== "TRY" || Number(order.total_amount) <= 0) {
    return NextResponse.json({ error: "Bu sipariş online ödenemez." }, { status: 400 });
  }

  const settings = await getTenantStorefrontSettings(tenant.id);
  const problems = settings.payment_methods?.online
    ? await getOnlinePaymentProblems({ supabase, tenantId: tenant.id, plan: tenant.plan, legalProfile: settings.legal_profile })
    : ["kapalı"];
  const provider = problems.length ? null : await loadTenantPaymentProvider(supabase, tenant.id);
  if (!provider) {
    return NextResponse.json(
      { error: "Mağaza şu an online ödeme alamıyor. Lütfen mağazayla iletişime geçin." },
      { status: 409 },
    );
  }

  const { count } = await supabase
    .from("order_payment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id);
  if ((count ?? 0) >= MAX_ATTEMPTS_PER_ORDER) {
    return NextResponse.json(
      { error: "Çok fazla ödeme denemesi yapıldı. Lütfen mağazayla iletişime geçin." },
      { status: 429 },
    );
  }

  const amount = Math.round(Number(order.total_amount) * 100) / 100;
  const reference = buildPaymentReference(order.order_no as number | null);
  const attempt = await createPaymentAttempt(supabase, {
    tenantId: tenant.id,
    orderId: order.id as string,
    provider: provider.provider,
    reference,
    amount,
  });

  const origin = getPublicOrigin(request);
  const pagePath = `${origin}/odeme/${parsed.data.token}`;
  const companyName = settings.storefront_title?.trim() || tenant.company_name;
  const result = await startProviderPayment(provider, {
    reference,
    amount,
    orderLabel: `${companyName} sipariş #${order.order_no ?? ""}`.trim().slice(0, 100),
    buyer: {
      name: (order.customer_name as string | null)?.trim() || "Müşteri",
      phone: (order.customer_phone as string | null) ?? "",
      email: parsed.data.email,
      address: (order.customer_address as string | null) ?? "",
      city: "",
      ip: getClientIp(request) ?? "85.105.0.1",
      identityNumber: normalizeTcKimlik(parsed.data.identity_number),
    },
    installmentsEnabled: settings.online_payment_settings?.installments_enabled ?? true,
    urls: {
      iyzicoCallback: `${origin}/api/payments/iyzico/callback?ref=${reference}`,
      paynetConfirm: `${origin}/api/payments/paynet/confirm?ref=${reference}`,
      returnOk: `${pagePath}?sonuc=1`,
      returnFail: `${pagePath}?sonuc=0`,
    },
  });

  if (!result.ok) {
    await supabase
      .from("order_payment_attempts")
      .update({ status: "failed", error: result.error.slice(0, 500), completed_at: new Date().toISOString() })
      .eq("id", attempt.id);
    console.error("[online-payment] başlatılamadı", { tenantId: tenant.id, provider: provider.provider, error: result.error });
    return NextResponse.json(
      { error: "Ödeme sayfası açılamadı. Lütfen biraz sonra tekrar deneyin." },
      { status: 502 },
    );
  }
  if (result.providerToken) await setAttemptProviderToken(supabase, attempt.id, result.providerToken);
  return NextResponse.json({ status: "started", mode: result.mode, url: result.url });
}
