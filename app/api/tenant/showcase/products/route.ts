import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

export async function POST(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("showcase_products", { blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const { section_id, product_id } = await request.json();

  if (!section_id || !product_id) {
    return NextResponse.json(
      { error: "section_id ve product_id gereklidir." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const { data: section } = await supabase
    .from("storefront_sections")
    .select("id")
    .eq("id", section_id)
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();

  if (!section) {
    return NextResponse.json({ error: "Bölüm bulunamadı." }, { status: 404 });
  }

  const { data: last } = await supabase
    .from("storefront_section_products")
    .select("display_order")
    .eq("section_id", section_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("storefront_section_products")
    .upsert({
      section_id,
      product_id,
      display_order: ((last as { display_order: number } | null)?.display_order ?? 0) + 1,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("showcase_products", { blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const { section_id, product_id } = await request.json();

  if (!section_id || !product_id) {
    return NextResponse.json(
      { error: "section_id ve product_id gereklidir." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const { data: section } = await supabase
    .from("storefront_sections")
    .select("id")
    .eq("id", section_id)
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();

  if (!section) {
    return NextResponse.json({ error: "Bölüm bulunamadı." }, { status: 404 });
  }

  const { error } = await supabase
    .from("storefront_section_products")
    .delete()
    .eq("section_id", section_id)
    .eq("product_id", product_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
