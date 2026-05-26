import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { storefrontSettingsSchema } from "@/lib/validators/storefront-settings";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const supabase = createSupabaseAdminClient();

  let existingSettings = getDefaultTenantStorefrontSettings(session.tenant!.id);

  if (supabase) {
    const { data } = await supabase
      .from("tenant_storefront_settings")
      .select(
        "tenant_id, theme_key, logo_url, storefront_title, storefront_description, hero_heading, hero_cta_label, banner_items",
      )
      .eq("tenant_id", session.tenant!.id)
      .maybeSingle();

    if (data) {
      existingSettings = {
        ...existingSettings,
        ...data,
      };
    }
  }

  const parsed = storefrontSettingsSchema.safeParse({
    whatsapp_number: body.whatsapp_number,
    storefront_title: body.storefront_title ?? existingSettings.storefront_title,
    storefront_description:
      body.storefront_description ?? existingSettings.storefront_description,
    hero_heading: body.hero_heading ?? existingSettings.hero_heading,
    hero_cta_label: body.hero_cta_label ?? existingSettings.hero_cta_label,
    banner_items: body.banner_items ?? existingSettings.banner_items,
    theme_key: body.theme_key ?? existingSettings.theme_key,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ayarlar doğrulanamadı." },
      { status: 400 },
    );
  }

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tenant: {
        ...session.tenant,
        whatsapp_number: parsed.data.whatsapp_number,
      },
      storefrontSettings: {
        tenant_id: session.tenant!.id,
        theme_key: parsed.data.theme_key,
        logo_url: null,
        storefront_title: parsed.data.storefront_title,
        storefront_description: parsed.data.storefront_description,
        hero_heading: parsed.data.hero_heading,
        hero_cta_label: parsed.data.hero_cta_label,
        banner_items: parsed.data.banner_items,
      },
    });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .update({ whatsapp_number: parsed.data.whatsapp_number })
    .eq("id", session.tenant!.id)
    .select("*")
    .single();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 400 });
  }

  const storefrontPayload = {
    tenant_id: session.tenant!.id,
    theme_key: parsed.data.theme_key,
    storefront_title: parsed.data.storefront_title,
    storefront_description: parsed.data.storefront_description,
    hero_heading: parsed.data.hero_heading,
    hero_cta_label: parsed.data.hero_cta_label,
    banner_items: parsed.data.banner_items,
  };

  const { data: storefrontSettings, error: storefrontError } = await supabase
    .from("tenant_storefront_settings")
    .upsert(storefrontPayload, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (storefrontError) {
    return NextResponse.json({ error: storefrontError.message }, { status: 400 });
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ tenant, storefrontSettings });
}