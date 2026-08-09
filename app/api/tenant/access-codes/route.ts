import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureAccessCodeLimitResponse, ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { accessCodeSchema } from "@/lib/validators/access-code";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();

  if (typeof body.is_password_protected !== "boolean") {
    return NextResponse.json(
      { error: "is_password_protected alanı zorunludur." },
      { status: 400 },
    );
  }

  const tenant = session.tenant!;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

    return NextResponse.json({
      tenant: { ...tenant, is_password_protected: body.is_password_protected },
    });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({ is_password_protected: body.is_password_protected })
    .eq("id", tenant.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Şifre ayarı güncellenemedi." },
      { status: 400 },
    );
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ tenant: data });
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const limitGuard = await ensureAccessCodeLimitResponse();
  if (limitGuard) {
    return limitGuard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const parsed = accessCodeSchema.safeParse({
    ...body,
    tenant_id: session.tenant!.id,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Kod verisi hatalı." },
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

    return NextResponse.json({
      accessCode: {
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...parsed.data,
      },
    });
  }

  const { data, error } = await supabase
    .from("access_codes")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Şifre eklenemedi." }, { status: 400 });
  }

  return NextResponse.json({ accessCode: data });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Silinecek kod seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("access_codes")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);

  if (error) {
    return NextResponse.json({ error: "Şifre silinemedi." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}