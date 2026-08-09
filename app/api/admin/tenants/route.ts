import { NextResponse } from "next/server";
import { demoTenants } from "@/lib/demo-data";
import { shouldAllowDemoFallback } from "@/lib/env";
import { generateTemporaryPassword } from "@/lib/auth/password";
import { getTrialEndDate } from "@/lib/billing/trial";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isReservedSubdomain,
  RESERVED_SUBDOMAIN_MESSAGE,
} from "@/lib/tenancy/reserved-subdomains";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import type { Profile, Tenant } from "@/lib/types";
import { tenantSchema } from "@/lib/validators/tenant";

export async function GET() {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ tenants: demoTenants });
  }

  const { data, error } = await supabase.from("tenants").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ tenants: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const body = await request.json();
  const parsed = tenantSchema.safeParse({
    ...body,
    max_product_limit: body.max_product_limit
      ? Number(body.max_product_limit)
      : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz tenant verisi." },
      { status: 400 },
    );
  }

  if (isReservedSubdomain(parsed.data.subdomain)) {
    return NextResponse.json(
      { error: RESERVED_SUBDOMAIN_MESSAGE },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      status: "active",
      created_at: new Date().toISOString(),
      company_name: parsed.data.company_name,
      subdomain: parsed.data.subdomain.toLowerCase(),
      plan: parsed.data.plan,
      max_product_limit: parsed.data.max_product_limit,
      whatsapp_number: parsed.data.whatsapp_number,
      is_whatsapp_order_direct: true,
      custom_domain: null,
      trial_ends_at: parsed.data.is_trial ? getTrialEndDate() : null,
      plan_started_at: null,
      plan_expires_at: null,
      visitor_limit_addon: 0,
      visitor_quota_exceeded: false,
      product_limit_addon: 0,
      is_demo: false,
      business_type: parsed.data.business_type ?? "general",
      is_password_protected: true,
    };
    const profile: Profile = {
      id: crypto.randomUUID(),
      full_name: parsed.data.tenant_admin_full_name ?? null,
      role: "tenant_admin",
      must_change_password: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      tenant,
      tenantAdmin: {
        email: parsed.data.tenant_admin_email,
        temporaryPassword,
        profile,
      },
    });
  }

  const temporaryPassword = generateTemporaryPassword();
  const payload = {
    company_name: parsed.data.company_name,
    subdomain: parsed.data.subdomain.toLowerCase(),
    plan: parsed.data.plan,
    max_product_limit: parsed.data.max_product_limit,
    whatsapp_number: parsed.data.whatsapp_number,
    status: "active",
    business_type: parsed.data.business_type ?? "general",
    // Kolonu yalnızca deneme hesabında gönder: 0041 migration'ı henüz
    // uygulanmamış bir ortamda normal tenant oluşturma etkilenmesin.
    ...(parsed.data.is_trial ? { trial_ends_at: getTrialEndDate() } : {}),
  };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert(payload)
    .select("*")
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: "Tenant oluşturulamadı. Alt alan adı veya veri çakışması olabilir." },
      { status: 400 },
    );
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.tenant_admin_email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.tenant_admin_full_name ?? parsed.data.company_name,
    },
  });

  if (authError || !authUser.user) {
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json(
      { error: "Tenant admin hesabı oluşturulamadı." },
      { status: 400 },
    );
  }

  const profilePayload = {
    id: authUser.user.id,
    full_name: parsed.data.tenant_admin_full_name ?? null,
    role: "tenant_admin",
    must_change_password: true,
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profilePayload);

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json(
      { error: "Tenant admin profili oluşturulamadı." },
      { status: 400 },
    );
  }

  const { error: membershipError } = await supabase.from("tenant_memberships").insert({
    tenant_id: tenant.id,
    user_id: authUser.user.id,
  });

  if (membershipError) {
    await supabase.from("profiles").delete().eq("id", authUser.user.id);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json(
      { error: "Tenant admin üyeliği oluşturulamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    tenant,
    tenantAdmin: {
      email: parsed.data.tenant_admin_email,
      temporaryPassword,
    },
  });
}