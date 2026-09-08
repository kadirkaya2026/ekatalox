// Esnaf (market tipi) mağazalar için üç net tema: vitrin / taze / dukkan.
import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { getEsnafThemePreset } from "@/lib/storefront/esnaf-themes";
import { applyMarketTemplateDesign } from "@/lib/storefront/market-template";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json().catch(() => null);
  const preset = getEsnafThemePreset(typeof body?.theme === "string" ? body.theme : "");

  if (!preset) {
    return NextResponse.json({ error: "Geçersiz tema." }, { status: 400 });
  }
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu temalar yalnız esnaf (market tipi) mağazalar içindir." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, theme: preset.key });
  }

  let ok: boolean;
  if (preset.settings === null) {
    ok = await applyMarketTemplateDesign(supabase, tenant.id);
  } else {
    const { data: existing } = await supabase
      .from("tenant_storefront_settings")
      .select("tenant_id")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    const payload = { ...preset.settings, esnaf_theme_key: preset.key };
    const { error } = existing
      ? await supabase.from("tenant_storefront_settings").update(payload).eq("tenant_id", tenant.id)
      : await supabase.from("tenant_storefront_settings").insert({ tenant_id: tenant.id, ...payload });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.json({ error: "Tema uygulanamadı. Lütfen tekrar deneyin." }, { status: 500 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  return NextResponse.json({ ok: true, theme: preset.key });
}
