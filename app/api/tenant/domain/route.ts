import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import { customDomainUpdateSchema } from "@/lib/validators/custom-domain";
import type { Tenant } from "@/lib/types";

export async function PATCH(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("custom_domain", { blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenantId = session.tenant!.id;
  const body = await request.json();
  const parsed = customDomainUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Alan adı verisi hatalı." },
      { status: 400 },
    );
  }

  const nextCustomDomain = parsed.data.custom_domain;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tenant: {
        ...session.tenant!,
        custom_domain: nextCustomDomain,
      } satisfies Tenant,
    });
  }

  if (nextCustomDomain) {
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .ilike("custom_domain", nextCustomDomain)
      .neq("id", tenantId)
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json(
        { error: "Bu alan adı başka bir mağaza tarafından kullanılıyor." },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({ custom_domain: nextCustomDomain })
    .eq("id", tenantId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Özel alan adı kaydedilemedi." },
      { status: 400 },
    );
  }

  return NextResponse.json({ tenant: data as Tenant });
}
