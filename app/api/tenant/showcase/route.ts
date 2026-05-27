import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }
    return NextResponse.json({ sections: [] });
  }

  const { data: sections } = await supabase
    .from("storefront_sections")
    .select("*")
    .eq("tenant_id", session.tenant!.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const sectionList = sections ?? [];

  if (sectionList.length === 0) {
    return NextResponse.json({ sections: [] });
  }

  const sectionIds = sectionList.map((s: { id: string }) => s.id);

  const { data: sectionProductRows } = await supabase
    .from("storefront_section_products")
    .select("section_id, display_order, products(*)")
    .in("section_id", sectionIds)
    .order("display_order", { ascending: true });

  const productsBySectionId = new Map<string, unknown[]>();
  for (const row of (sectionProductRows ?? []) as Array<{
    section_id: string;
    products: unknown;
  }>) {
    if (!row.products) continue;
    const existing = productsBySectionId.get(row.section_id) ?? [];
    existing.push(row.products);
    productsBySectionId.set(row.section_id, existing);
  }

  const result = sectionList.map((section: { id: string }) => ({
    ...section,
    products: productsBySectionId.get(section.id) ?? [],
  }));

  return NextResponse.json({ sections: result });
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const { title } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Bölüm başlığı gereklidir." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }
    return NextResponse.json({ section: { id: crypto.randomUUID(), title, products: [] } });
  }

  const { data: existing } = await supabase
    .from("storefront_sections")
    .select("id")
    .eq("tenant_id", session.tenant!.id);

  if ((existing?.length ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Maksimum 3 vitrin bölümü oluşturabilirsiniz." },
      { status: 400 },
    );
  }

  const { data: last } = await supabase
    .from("storefront_sections")
    .select("display_order")
    .eq("tenant_id", session.tenant!.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("storefront_sections")
    .insert({
      tenant_id: session.tenant!.id,
      title: title.trim(),
      display_order: ((last as { display_order: number } | null)?.display_order ?? 0) + 1,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Bölüm oluşturulamadı." }, { status: 400 });
  }

  return NextResponse.json({ section: { ...data, products: [] } });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Silinecek bölüm seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("storefront_sections")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
