import { NextResponse } from "next/server";
import { z } from "zod";
import type { TenantPlan } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/session";
import { canReceiveOrderEmails } from "@/lib/orders/order-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ayarlar → E-posta Bildirimleri (14 Eki 2026): bildirim adresi
// (tenants.contact_email — kayıtta verilen, panel giriş e-postasından ayrı)
// ve "her siparişte e-posta" anahtarı (order_email_enabled, 0173; ücretli plan).
const bodySchema = z
  .object({
    contact_email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .email("Geçerli bir e-posta adresi yazın.")
      .optional(),
    order_email_enabled: z.boolean().optional(),
  })
  .refine((b) => b.contact_email !== undefined || b.order_email_enabled !== undefined, {
    message: "Değiştirilecek alan yok.",
  });

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz istek." }, { status: 400 });
  }

  if (parsed.data.order_email_enabled === true && !canReceiveOrderEmails(tenant.plan as TenantPlan)) {
    return NextResponse.json(
      { error: "Her siparişte e-posta ücretli paketlerde kullanılabilir. Paketim sayfasından paket seçebilirsiniz." },
      { status: 403 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.contact_email !== undefined) update.contact_email = parsed.data.contact_email;
  if (parsed.data.order_email_enabled !== undefined) update.order_email_enabled = parsed.data.order_email_enabled;

  const { data, error } = await supabase
    .from("tenants")
    .update(update)
    .eq("id", tenant.id)
    .select("contact_email, order_email_enabled")
    .maybeSingle();

  if (error || !data) {
    console.error("[settings/email] kaydedilemedi:", error?.message);
    return NextResponse.json({ error: "E-posta ayarı kaydedilemedi." }, { status: 400 });
  }

  return NextResponse.json(data);
}
