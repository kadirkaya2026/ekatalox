import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json().catch(() => null);

  if (typeof body?.age_verification_required !== "boolean") {
    return NextResponse.json(
      { error: "age_verification_required alanı zorunludur." },
      { status: 400 },
    );
  }

  if (tenant.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu ayar sadece market tipi hesaplar için kullanılabilir." },
      { status: 403 },
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

    revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

    return NextResponse.json({
      tenant: { ...tenant, age_verification_required: body.age_verification_required },
    });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({ age_verification_required: body.age_verification_required })
    .eq("id", tenant.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Yaş doğrulama ayarı güncellenemedi." },
      { status: 400 },
    );
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ tenant: data });
}
