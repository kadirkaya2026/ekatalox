import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantStorefrontSettings } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { sendCustomerPush } from "@/lib/push/send-customer-push";
import { formatCouponBenefit } from "@/lib/coupons/shared";

const createSchema = z.object({
  kind: z.enum(["percent", "amount"]),
  value: z.number().positive().max(100000),
  min_order_amount: z.number().min(0).max(1_000_000).nullable().optional(),
  expires_in_days: z.number().int().min(1).max(365).nullable().optional(),
  message: z.string().trim().max(200).optional().default(""),
}).refine((v) => v.kind !== "percent" || v.value <= 100, { message: "Yüzde 100'ü aşamaz.", path: ["value"] });

async function guard() {
  const g = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (g) return { error: g } as const;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return { error: NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için." }, { status: 403 }) } as const;
  }
  return { session, tenant } as const;
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ coupons: [] });
  const { data } = await supabase
    .from("customer_coupons")
    .select("id, kind, value, min_order_amount, currency, title, message, expires_at, single_use, status, used_at, created_at")
    .eq("tenant_id", g.tenant.id)
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz kupon." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { data: customer } = await supabase
    .from("customers")
    .select("id, phone, full_name")
    .eq("tenant_id", g.tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (!customer) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });

  const input = parsed.data;
  const currency = "TRY";
  const benefit = formatCouponBenefit({ kind: input.kind, value: input.value, currency });
  const title = `Size özel ${benefit} indirim`;
  const expiresAt = input.expires_in_days
    ? new Date(Date.now() + input.expires_in_days * 86_400_000).toISOString()
    : null;

  // Aynı müşterinin önceki aktif kuponu iptal edilir: sepette hangisi
  // uygulanacak belirsizliği olmasın (bayi yeni kuponu bilerek tanımlıyor).
  await supabase
    .from("customer_coupons")
    .update({ status: "cancelled" })
    .eq("tenant_id", g.tenant.id)
    .eq("customer_id", customer.id)
    .eq("status", "active");

  const { data: coupon, error } = await supabase
    .from("customer_coupons")
    .insert({
      tenant_id: g.tenant.id,
      customer_id: customer.id,
      phone: customer.phone,
      kind: input.kind,
      value: input.value,
      min_order_amount: input.min_order_amount ?? null,
      currency,
      title,
      message: input.message || null,
      expires_at: expiresAt,
      single_use: true,
      created_by: g.session.profile?.id ?? null,
    })
    .select("id, kind, value, min_order_amount, currency, title, message, expires_at, single_use, status, used_at, created_at")
    .single();
  if (error || !coupon) return NextResponse.json({ error: "Kupon kaydedilemedi." }, { status: 500 });

  // Müşteriye push (abone olduysa). Bayi adı ve logosuyla, vitrine götürür.
  const tenant = g.tenant;
  after(async () => {
    const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
    const storeName = settings?.storefront_title?.trim() || tenant.company_name;
    const origin = tenant.custom_domain?.trim()
      ? `https://${tenant.custom_domain.trim()}`
      : `https://${tenant.subdomain}.${appEnv.rootDomain}`;
    const minPart = input.min_order_amount ? ` (${input.min_order_amount.toLocaleString("tr-TR")} ₺ ve üzeri)` : "";
    const datePart = expiresAt ? ` · ${input.expires_in_days} gün geçerli` : "";
    await sendCustomerPush({
      tenantId: tenant.id,
      customerId: customer.id,
      title: `${storeName}: size özel ${benefit} indirim 🎁`,
      body: `${input.message || "Bir sonraki siparişinizde sepette kendiliğinden uygulanır."}${minPart}${datePart}`,
      url: `${origin}/?kampanya=1`,
      iconUrl: settings?.logo_url || settings?.site_favicon_url || null,
      tag: `coupon-${coupon.id}`,
    }).catch((err) => console.error("[coupon-push] hata:", err));
  });

  return NextResponse.json({ coupon }, { status: 201 });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  const couponId = new URL(request.url).searchParams.get("coupon") ?? "";
  const supabase = createSupabaseAdminClient();
  if (!supabase || !couponId) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  await supabase
    .from("customer_coupons")
    .update({ status: "cancelled" })
    .eq("tenant_id", g.tenant.id)
    .eq("customer_id", id)
    .eq("id", couponId)
    .eq("status", "active");
  return NextResponse.json({ ok: true });
}
