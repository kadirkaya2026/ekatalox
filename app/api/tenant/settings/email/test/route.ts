import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { buildNewOrderEmail } from "@/lib/email/templates/new-order";
import { orderEmailUrls } from "@/lib/orders/order-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// "Deneme e-postası gönder": örnek bir sipariş e-postasını bildirim adresine
// yollar; toptancı e-postanın gelip gelmediğini (spam dahil) kendisi görür.
// Instance içi basit frenleme: tenant başına dakikada bir.
const lastSent = new Map<string, number>();

export async function POST() {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const now = Date.now();
  if ((lastSent.get(tenant.id) ?? 0) > now - 60_000) {
    return NextResponse.json({ error: "Biraz bekleyip tekrar deneyin." }, { status: 429 });
  }

  const supabase = createSupabaseAdminClient();
  const { data } = supabase
    ? await supabase.from("tenants").select("company_name, business_type, contact_email").eq("id", tenant.id).maybeSingle()
    : { data: null };
  if (!data?.contact_email) {
    return NextResponse.json({ error: "Önce bildirim e-posta adresini kaydedin." }, { status: 400 });
  }

  const mail = buildNewOrderEmail({
    businessName: data.company_name,
    businessType: data.business_type ?? null,
    orderNo: 1001,
    orderNumber: "DENEME",
    orderDate: new Date(),
    customerName: "Deneme Müşteri",
    customerPhone: "0555 000 00 00",
    customerAddress: "Bu bir deneme siparişidir; gerçek bir sipariş değildir.",
    note: null,
    paymentLabel: "Nakit",
    currency: "TRY",
    items: [
      { name: "Örnek ürün", code: "ORNEK-1", quantity: 2, unitLabel: "adet", lineTotal: 500 },
      { name: "Örnek ürün 2", code: "ORNEK-2", quantity: 1, unitLabel: "koli", lineTotal: 1250 },
    ],
    totals: [{ label: "Ara toplam", amount: 1750 }],
    finalTotal: 1750,
    ...orderEmailUrls(),
  });

  lastSent.set(tenant.id, now);
  const ok = await sendEmail({ to: data.contact_email, ...mail, subject: `[Deneme] ${mail.subject}` });
  if (!ok) {
    return NextResponse.json({ error: "E-posta gönderilemedi. Daha sonra tekrar deneyin." }, { status: 502 });
  }
  return NextResponse.json({ sent: true, to: data.contact_email });
}
