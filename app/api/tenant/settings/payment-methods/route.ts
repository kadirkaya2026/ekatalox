import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { hasPlanFeature } from "@/lib/billing/plans";
import { isValidIban, normalizeIban } from "@/lib/storefront/payment-methods";

// Ayarlar → Ödeme ve Kampanyalar (0145, 28 Eyl 2026). İki formdan kısmi
// gövdeyle çağrılır: "Ödeme" sekmesi (yöntemler, IBAN, online tercihleri —
// tüm paketler) ve "Ödeme Kampanyaları" içindeki Havale Kampanyası
// (payment_settings özelliği olan paketler).
const tierSchema = z.object({
  threshold: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

const bodySchema = z
  .object({
    payment_methods: z
      .object({
        cash: z.boolean(),
        transfer: z.boolean(),
        card: z.boolean(),
        online: z.boolean(),
      })
      .optional(),
    bank_iban: z.string().trim().max(40).nullable().optional(),
    bank_account_holder: z.string().trim().max(120).nullable().optional(),
    bank_name: z.string().trim().max(80).nullable().optional(),
    online_payment_settings: z
      .object({
        provider: z.enum(["iyzico", "paytr"]).nullable().optional(),
        installments_enabled: z.boolean().optional(),
        commission_to_customer: z.boolean().optional(),
      })
      .optional(),
    is_transfer_discount_active: z.boolean().optional(),
    transfer_discount_note: z.string().trim().max(300).nullable().optional(),
    transfer_discount_tiers: z.array(tierSchema).max(20).optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ödeme ayarları geçersiz." },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const update: Record<string, unknown> = {};

  if (body.payment_methods) {
    // Sanal POS entegrasyonu tamamlanana kadar online vitrinde açılamaz.
    const methods = { ...body.payment_methods, online: false };
    update.payment_methods = methods;
  }

  if (body.bank_iban !== undefined) {
    const iban = normalizeIban(body.bank_iban);
    if (iban && !isValidIban(iban)) {
      return NextResponse.json(
        { error: "IBAN geçersiz görünüyor. TR ile başlayan 26 karakterlik IBAN'ı kontrol edin." },
        { status: 400 },
      );
    }
    update.bank_iban = iban || null;
  }
  if (body.bank_account_holder !== undefined) update.bank_account_holder = body.bank_account_holder || null;
  if (body.bank_name !== undefined) update.bank_name = body.bank_name || null;

  if (body.payment_methods?.transfer) {
    const iban = (update.bank_iban as string | null | undefined) ?? undefined;
    const holder = (update.bank_account_holder as string | null | undefined) ?? undefined;
    if (!iban || !holder) {
      return NextResponse.json(
        { error: "Havale / EFT'yi açmak için IBAN ve hesap sahibinin adını girin." },
        { status: 400 },
      );
    }
  }

  if (body.online_payment_settings) {
    update.online_payment_settings = {
      provider: body.online_payment_settings.provider ?? null,
      installments_enabled: body.online_payment_settings.installments_enabled ?? true,
      commission_to_customer: body.online_payment_settings.commission_to_customer ?? false,
    };
  }

  const touchesTransferCampaign =
    body.is_transfer_discount_active !== undefined ||
    body.transfer_discount_note !== undefined ||
    body.transfer_discount_tiers !== undefined;

  if (touchesTransferCampaign) {
    if (!hasPlanFeature(tenant.plan, "payment_settings")) {
      return NextResponse.json(
        { error: "Havale kampanyası Profesyonel ve Kurumsal paketlerde kullanılabilir." },
        { status: 403 },
      );
    }
    if (body.is_transfer_discount_active !== undefined) {
      update.is_transfer_discount_active = body.is_transfer_discount_active;
    }
    if (body.transfer_discount_note !== undefined) {
      update.transfer_discount_note = body.transfer_discount_note || null;
    }
    if (body.transfer_discount_tiers !== undefined) {
      update.transfer_discount_tiers = [...body.transfer_discount_tiers].sort(
        (a, b) => a.threshold - b.threshold,
      );
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Kaydedilecek bir değişiklik yok." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("tenant_storefront_settings")
    .update(update)
    .eq("tenant_id", tenant.id)
    .select(
      "payment_methods, bank_iban, bank_account_holder, bank_name, online_payment_settings, is_transfer_discount_active, transfer_discount_note, transfer_discount_tiers",
    )
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Ödeme ayarları kaydedilemedi." }, { status: 400 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ settings: data });
}
