import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantStorefrontSettings } from "@/lib/data";
import { sendCreditReminderPush } from "@/lib/push/send-credit-reminder-push";
import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";

// Tahsilat bildirimi: müşterinin AÇIK veresiye toplamını hesaplar ve push
// aboneliği olan cihazlarına hatırlatma gönderir. Abonelik yoksa sent=0
// döner; panel bunu açıkça söyler (müşteri takip sayfasından bildirim açar).
const schema = z.object({ customer_id: z.string().uuid() });

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: openOrders } = await supabase
    .from("orders")
    .select("id, tracking_token, total_amount, currency, created_at")
    .eq("tenant_id", tenant.id)
    .eq("customer_id", parsed.data.customer_id)
    .not("credit_marked_at", "is", null)
    .is("credit_paid_at", null)
    .order("created_at", { ascending: false });

  if (!openOrders?.length) {
    return NextResponse.json({ error: "Bu müşterinin açık veresiyesi yok." }, { status: 400 });
  }

  // Para birimi bazında topla (pratikte tek birim; karışıksa hepsi yazılır).
  const totals = new Map<string, number>();
  for (const order of openOrders) {
    if (order.currency === "CATALOG") continue;
    totals.set(order.currency, (totals.get(order.currency) ?? 0) + (order.total_amount ?? 0));
  }
  const totalLabel =
    [...totals.entries()]
      .map(([currency, amount]) => formatCurrency(amount, currency as CurrencyCode))
      .join(" + ") || `${openOrders.length} sipariş`;

  const origin = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ekatalox.com"}`;
  const latestToken = openOrders[0]?.tracking_token as string | null;
  const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);

  const sent = await sendCreditReminderPush({
    tenantId: tenant.id,
    customerId: parsed.data.customer_id,
    orderIds: openOrders.map((order) => order.id as string),
    tenantName: settings?.storefront_title?.trim() || tenant.company_name,
    totalLabel,
    iconUrl: settings?.logo_url || settings?.site_favicon_url || null,
    url: latestToken ? `${origin}/siparis/${latestToken}` : null,
  });

  return NextResponse.json({ sent, totalLabel, openCount: openOrders.length });
}
