import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { categorySchema } from "@/lib/validators/category";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const parsed = categorySchema.safeParse({
    ...body,
    tenant_id: session.tenant!.id,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Kategori verisi hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Sunucu yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      category: {
        id: randomUUID(),
        parent_id: parsed.data.parent_id ?? null,
        display_order: 0,
        created_at: new Date().toISOString(),
        ...parsed.data,
      },
    });
  }

  if (parsed.data.parent_id) {
    const { data: parentCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.parent_id)
      .eq("tenant_id", session.tenant!.id)
      .maybeSingle();

    if (!parentCategory) {
      return NextResponse.json(
        { error: "Seçilen üst kategori bulunamadı." },
        { status: 400 },
      );
    }
  }

  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", session.tenant!.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...parsed.data,
      parent_id: parsed.data.parent_id ?? null,
      display_order: (lastCategory?.display_order ?? 0) + 1,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Silinecek kategori seçilmedi." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Sunucu yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.tenant!.id)
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Bu kategoriye bağlı ürünler olduğu için silinemez." },
      { status: 400 },
    );
  }

  const { count: childCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.tenant!.id)
    .eq("parent_id", id);

  if ((childCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Bu kategoriye bağlı alt kategoriler olduğu için silinemez." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}