import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { hasPlanFeature } from "@/lib/billing/plans";
import {
  buildKeyHint,
  decryptCredentials,
  encryptCredentials,
  getTenantPaymentProviderSummary,
  isPaymentCredentialStoreReady,
  type ProviderCredentials,
} from "@/lib/payments/credentials";
import { PROVIDER_CREDENTIAL_FIELDS } from "@/lib/payments/providers";
import { verifyProviderCredentials } from "@/lib/payments/gateway";
import { disableOnlinePaymentMethod } from "@/lib/payments/readiness";

// Ayarlar → Ödeme → Online ödeme (0185): mağazanın kendi sağlayıcı hesabının
// anahtarları. Kayıtta sağlayıcıya ücretsiz bir doğrulama isteği atılır;
// anahtarlar şifreli saklanır ve hiçbir yanıtta geri gönderilmez.
const bodySchema = z
  .object({
    provider: z.enum(["iyzico", "paytr", "paynet"]),
    is_test: z.boolean(),
    /** Boş bırakılan alan: aynı sağlayıcıda kayıtlı değer korunur. */
    credentials: z.record(z.string(), z.string().trim().max(200)),
  })
  .strict();

async function guardOnlinePayment() {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return { response: guard } as const;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (!hasPlanFeature(tenant.plan, "online_payment")) {
    return {
      response: NextResponse.json({ error: "Online ödeme Kurumsal pakette kullanılabilir." }, { status: 403 }),
    } as const;
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase || !isPaymentCredentialStoreReady()) {
    return {
      response: NextResponse.json({ error: "Sunucu yapılandırması eksik (ödeme anahtarı kasası)." }, { status: 500 }),
    } as const;
  }
  return { tenant, supabase } as const;
}

export async function PUT(request: Request) {
  const ctx = await guardOnlinePayment();
  if ("response" in ctx) return ctx.response;
  const { tenant, supabase } = ctx;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bilgiler geçersiz." }, { status: 400 });
  }
  const { provider, is_test } = parsed.data;

  const { data: existing } = await supabase
    .from("tenant_payment_providers")
    .select("provider, credentials_enc")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const previous =
    existing && existing.provider === provider ? decryptCredentials(existing.credentials_enc as string) : {};

  const credentials: Record<string, string> = {};
  for (const field of PROVIDER_CREDENTIAL_FIELDS[provider]) {
    const value = parsed.data.credentials[field.key]?.trim() || previous[field.key] || "";
    if (!value) {
      return NextResponse.json({ error: `${field.label} boş olamaz.` }, { status: 400 });
    }
    credentials[field.key] = value;
  }

  const check = await verifyProviderCredentials({ provider, credentials, isTest: is_test } as ProviderCredentials & {
    isTest: boolean;
  });

  const now = new Date().toISOString();
  const { error } = await supabase.from("tenant_payment_providers").upsert(
    {
      tenant_id: tenant.id,
      provider,
      is_test,
      credentials_enc: encryptCredentials(credentials),
      key_hint: buildKeyHint(provider, credentials),
      verified_at: check.ok ? now : null,
      last_error: check.ok ? null : check.error,
      updated_at: now,
    },
    { onConflict: "tenant_id" },
  );
  if (error) {
    return NextResponse.json({ error: "Anahtarlar kaydedilemedi." }, { status: 400 });
  }

  // Doğrulanamayan anahtarla vitrinde online ödeme açık kalmasın.
  if (!check.ok) await disableOnlinePaymentMethod(supabase, tenant.id);
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({
    provider: await getTenantPaymentProviderSummary(supabase, tenant.id),
    verified: check.ok,
    error: check.ok ? null : check.error,
  });
}

export async function DELETE() {
  const ctx = await guardOnlinePayment();
  if ("response" in ctx) return ctx.response;
  const { tenant, supabase } = ctx;

  await supabase.from("tenant_payment_providers").delete().eq("tenant_id", tenant.id);
  await disableOnlinePaymentMethod(supabase, tenant.id);
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  return NextResponse.json({ provider: null });
}
