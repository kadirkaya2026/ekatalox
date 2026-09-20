// Self-servis tenant açılışı (8 Eyl 2026). app/api/signup buradan çağırır.
// Süper admin akışındaki (app/api/admin/tenants) tenant → auth user →
// profil → üyelik zinciriyle aynı mantık; ek olarak tema, yer tutucu logo,
// varsayılan fiyat listeleri, kupon ve e-postalar. Her adım başarısız
// olursa o ana kadar yaratılanlar elle geri alınır ve signup_requests'e
// 'failed' satırı düşer ki satış ekibi düşen kayıtları görebilsin.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimitForPlan } from "@/lib/billing/plans";
import { getToptanPlan } from "@/lib/billing/toptan-plans";
import { sendEmail } from "@/lib/email/send";
import { getSalesRecipient } from "@/lib/email/transport";
import { buildSignupNotificationEmail } from "@/lib/email/templates/signup-notification";
import { buildWelcomeEmail } from "@/lib/email/templates/welcome";
import { appEnv } from "@/lib/env";
import { buildTenantBrandingPath, STOREFRONT_BRANDING_BUCKET } from "@/lib/storage/branding";
import { buildPlaceholderLogoSvg } from "@/lib/storefront/esnaf-themes";
import { registerTenantSubdomain } from "@/lib/vercel/domains";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { signupSchema, type SignupInput } from "@/lib/validators/signup";

export interface CreateTenantMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type CreateTenantResult =
  | {
      ok: true;
      tenantId: string;
      subdomain: string;
      storeUrl: string;
      panelUrl: string;
      /** Ücretsiz plan: deneme yok, her zaman null. */
      trialEndsAt: string | null;
      /** Formda seçilen paket (free ise yükseltme talebi yok). */
      requestedPlan: string;
    }
  | { ok: false; status: 400 | 409 | 500; error: string; field?: string };

const GENERIC_ERROR = "Kayıt tamamlanamadı. Lütfen tekrar deneyin ya da bize ulaşın.";

function buildStoreUrl(subdomain: string) {
  return `https://${subdomain}.${appEnv.rootDomain}`;
}

function buildPanelUrl() {
  return `https://${appEnv.appDomain}/`;
}

export async function isSubdomainTaken(supabase: SupabaseClient, subdomain: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .ilike("subdomain", subdomain)
    .limit(1)
    .maybeSingle();

  if (error) {
    // Emin olamıyorsak "dolu" varsay: yanlış pozitif, çift kayıttan iyidir.
    console.error("[signup] subdomain kontrolü başarısız:", error.message);
    return true;
  }

  return Boolean(data);
}

function isEmailExistsError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

/** Varsayılan fiyat listeleri. Ücretsiz planda 1 fiyatlı liste hakkı var
 *  (PLAN_PRICE_LIST_LIMITS.free), o yüzden fiyatsız katalog + tek liste. */
async function createDefaultPriceLists(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("price_lists")
    .insert([
      { tenant_id: tenantId, name: "Fiyatsız Katalog", is_catalog_only: true, sort_order: 0 },
      { tenant_id: tenantId, name: "1. Liste", is_catalog_only: false, sort_order: 1 },
    ])
    .select("id, is_catalog_only, sort_order");

  if (error) {
    throw new Error(`price_lists: ${error.message}`);
  }

  const firstPriced = (data ?? [])
    .filter((row) => !row.is_catalog_only)
    .sort((a, b) => a.sort_order - b.sort_order)[0];

  return firstPriced?.id ?? null;
}

async function uploadPlaceholderLogo(
  supabase: SupabaseClient,
  tenantId: string,
  businessName: string,
  sector: string,
): Promise<{ url: string; path: string } | null> {
  // Mevcut logo yüklemeleriyle aynı public bucket ("product-images") ve
  // aynı yol kalıbı ({tenantId}/branding/logo-*), bkz. app/api/tenant/settings/logo.
  const path = buildTenantBrandingPath({ tenantId, fileName: "placeholder.svg" });
  const svg = buildPlaceholderLogoSvg(businessName, sector);

  const { error } = await supabase.storage
    .from(STOREFRONT_BRANDING_BUCKET)
    .upload(path, Buffer.from(svg, "utf8"), {
      upsert: true,
      contentType: "image/svg+xml",
      cacheControl: "31536000",
    });

  if (error) {
    console.error("[signup] yer tutucu logo yüklenemedi:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(STOREFRONT_BRANDING_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function applyStorefrontTheme(
  supabase: SupabaseClient,
  tenantId: string,
  input: SignupInput,
  logoUrl: string | null,
) {
  // Toptancı vitrini: sistem varsayılan temasıyla açılır (bayi panelden
  // "Hazır Tema" seçer); yalnız ad, sekme başlığı ve yer tutucu logo yazılır.
  const { error } = await supabase.from("tenant_storefront_settings").upsert(
    {
      tenant_id: tenantId,
      storefront_title: input.businessName,
      site_tab_title: input.businessName,
      ...(logoUrl ? { logo_url: logoUrl, site_favicon_url: logoUrl } : {}),
    },
    { onConflict: "tenant_id" },
  );

  if (error) {
    throw new Error(`tenant_storefront_settings: ${error.message}`);
  }
}

export async function createSelfServiceTenant(
  rawInput: unknown,
  meta: CreateTenantMeta = {},
): Promise<CreateTenantResult> {
  const parsed = signupSchema.safeParse(rawInput);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      status: 400,
      error: issue?.message ?? "Form bilgileri geçersiz.",
      field: typeof issue?.path?.[0] === "string" ? issue.path[0] : undefined,
    };
  }

  const input = parsed.data;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, status: 500, error: "Sunucu yapılandırması eksik." };
  }

  // Hesap her zaman Ücretsiz planla açılır (20 Eyl 2026 freemium). Formda
  // ücretli paket seçildiyse bu bir taleptir: satış e-postasına düşer, ödeme
  // sonrası süper admin paketi yükseltir.
  const requestedPlan = getToptanPlan(input.plan);
  if (!requestedPlan) {
    return { ok: false, status: 400, error: "Geçerli bir paket seçin.", field: "plan" };
  }
  const planId = "free" as const;
  const billingPeriod = "yearly" as const;

  // (a) alt alan adı
  if (await isSubdomainTaken(supabase, input.subdomain)) {
    return {
      ok: false,
      status: 409,
      error: "Bu katalog adresi kullanımda. Lütfen başka bir ad deneyin.",
      field: "subdomain",
    };
  }

  const listPrice = requestedPlan.yearlyPrice;
  const finalPrice = listPrice;

  const requestBase = {
    business_name: input.businessName,
    sector: input.sector,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    city: input.city,
    district: input.district,
    neighborhood: input.neighborhood,
    address: input.address,
    tax_office: input.taxOffice || null,
    tax_number: input.taxNumber || null,
    subdomain: input.subdomain,
    // signup_requests.plan = talep edilen paket (tenants.plan her zaman free).
    plan: requestedPlan.slug,
    billing_period: billingPeriod,
    coupon_code: null,
    list_price: listPrice,
    final_price: finalPrice,
    ip_address: meta.ipAddress ?? null,
    user_agent: meta.userAgent ?? null,
  };

  async function logRequest(
    status: "created" | "failed",
    tenantId: string | null,
    error?: string,
  ) {
    const { error: logError } = await supabase!.from("signup_requests").insert({
      ...requestBase,
      tenant_id: tenantId,
      status,
      error: error ?? null,
    });
    if (logError) {
      console.error("[signup] signup_requests yazılamadı:", logError.message);
    }
  }

  const trialEndsAt: string | null = null;

  // (d) tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      company_name: input.businessName,
      subdomain: input.subdomain,
      plan: planId,
      max_product_limit: getLimitForPlan(planId),
      whatsapp_number: input.whatsappNumber,
      status: "active",
      business_type: "general",
      is_tekel: false,
      age_verification_required: false,
      sector: input.sector,
      billing_period: billingPeriod,
      coupon_code: null,
      contact_email: input.email,
      contact_full_name: input.fullName,
      billing_address: {
        city: input.city,
        district: input.district,
        neighborhood: input.neighborhood,
        address: input.address,
        tax_office: input.taxOffice || null,
        tax_number: input.taxNumber || null,
      },
      signup_source: "self_service",
      trial_ends_at: trialEndsAt,
    })
    .select("id, subdomain")
    .single();

  if (tenantError || !tenant) {
    const message = tenantError?.message ?? "tenant insert başarısız";
    console.error("[signup] tenant oluşturulamadı:", message);
    await logRequest("failed", null, message);
    const isConflict = (tenantError?.code ?? "") === "23505";
    return isConflict
      ? {
          ok: false,
          status: 409,
          error: "Bu katalog adresi kullanımda. Lütfen başka bir ad deneyin.",
          field: "subdomain",
        }
      : { ok: false, status: 500, error: GENERIC_ERROR };
  }

  const tenantId = tenant.id as string;
  let authUserId: string | null = null;
  let logoPath: string | null = null;

  async function rollback() {
    try {
      if (authUserId) {
        await supabase!.from("tenant_memberships").delete().eq("user_id", authUserId);
        await supabase!.from("profiles").delete().eq("id", authUserId);
        await supabase!.auth.admin.deleteUser(authUserId);
      }
      if (logoPath) {
        await supabase!.storage.from(STOREFRONT_BRANDING_BUCKET).remove([logoPath]);
      }
      // price_lists ve tenant_storefront_settings tenants'a cascade bağlı.
      await supabase!.from("tenants").delete().eq("id", tenantId);
    } catch (error) {
      console.error("[signup] rollback hatası:", error);
    }
  }

  try {
    // (f) yer tutucu logo — başarısız olursa mağaza logosuz açılır, akış sürer.
    const logo = await uploadPlaceholderLogo(supabase, tenantId, input.businessName, input.sector);
    logoPath = logo?.path ?? null;

    // (e) tema + içerik
    await applyStorefrontTheme(supabase, tenantId, input, logo?.url ?? null);

    // (g) varsayılan fiyat listeleri
    const firstPricedListId = await createDefaultPriceLists(supabase, tenantId);
    if (firstPricedListId) {
      const { error: publicListError } = await supabase
        .from("tenants")
        .update({ public_price_list_id: firstPricedListId })
        .eq("id", tenantId);
      if (publicListError) {
        console.error("[signup] public_price_list_id yazılamadı:", publicListError.message);
      }
    }

    // (h) auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });

    if (authError || !authUser.user) {
      if (isEmailExistsError(authError)) {
        await rollback();
        await logRequest("failed", null, "email_exists");
        return {
          ok: false,
          status: 409,
          error: "Bu e-posta adresiyle zaten bir hesap var. Giriş yapabilir ya da şifrenizi yenileyebilirsiniz.",
          field: "email",
        };
      }
      throw new Error(`auth.createUser: ${authError?.message ?? "bilinmeyen hata"}`);
    }
    authUserId = authUser.user.id;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authUserId,
      full_name: input.fullName,
      role: "tenant_admin",
      must_change_password: false,
    });
    if (profileError) {
      throw new Error(`profiles: ${profileError.message}`);
    }

    const { error: membershipError } = await supabase.from("tenant_memberships").insert({
      tenant_id: tenantId,
      user_id: authUserId,
    });
    if (membershipError) {
      throw new Error(`tenant_memberships: ${membershipError.message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[signup] kayıt zinciri başarısız:", message);
    await rollback();
    await logRequest("failed", null, message);
    return { ok: false, status: 500, error: GENERIC_ERROR };
  }

  // (k) kayıt izi
  await logRequest("created", tenantId);

  // (l) e-postalar — sendEmail hiç fırlatmaz.
  const storeUrl = buildStoreUrl(input.subdomain);
  const panelUrl = buildPanelUrl();
  const welcome = buildWelcomeEmail({
    fullName: input.fullName,
    businessName: input.businessName,
    email: input.email,
    storeUrl,
    panelUrl,
    requestedPlanName: requestedPlan.name,
    requestedPlanPrice: requestedPlan.yearlyPrice,
  });
  const notification = buildSignupNotificationEmail({
    tenantId,
    businessName: input.businessName,
    sector: input.sector,
    fullName: input.fullName,
    phone: input.phone,
    whatsappNumber: input.whatsappNumber,
    email: input.email,
    city: input.city,
    district: input.district,
    neighborhood: input.neighborhood,
    address: input.address,
    taxOffice: input.taxOffice,
    taxNumber: input.taxNumber,
    subdomain: input.subdomain,
    storeUrl,
    planName: `Ücretsiz (talep: ${requestedPlan.name})`,
    billingPeriod,
    listPrice,
    finalPrice,
    couponCode: null,
    trialEndsAt,
    ipAddress: meta.ipAddress ?? null,
  });

  await Promise.all([
    sendEmail({ to: input.email, ...welcome }),
    sendEmail({
      to: getSalesRecipient(),
      fromName: "eKatalox Kayıt",
      ...notification,
    }),
  ]);

  // Alt alan adını Vercel'e ekle (yoksa Cloudflare 525). Başarısızlık kaydı
  // bozmaz; süper admin panelden elle ekleyebilir.
  const domainResult = await registerTenantSubdomain(input.subdomain);
  if (!domainResult.ok) {
    console.error("[signup] Vercel alan adı eklenemedi:", input.subdomain, domainResult.reason);
  }

  return {
    ok: true,
    tenantId,
    subdomain: input.subdomain,
    storeUrl,
    panelUrl,
    trialEndsAt,
    requestedPlan: requestedPlan.slug,
  };
}
