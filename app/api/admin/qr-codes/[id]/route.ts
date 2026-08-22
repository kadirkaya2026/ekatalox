import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Kodu bir bayiye atar veya atamayı kaldırır — SADECE süper admin.
//
// Atama DEĞİŞTİRİLEBİLİR olmalı: bayi çıkarsa aynı magnet başka bayiye
// devredilir. Yönlendirme 302 + no-store olduğu için değişiklik anında
// yansır, basılı magnet ölmez (bkz. app/t/[slug]/route.ts).

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  // tenant_id null gönderilirse atama kaldırılır ve kod havuza döner.
  const tenantId =
    typeof body?.tenant_id === "string" && body.tenant_id.trim()
      ? body.tenant_id.trim()
      : null;
  const label = typeof body?.label === "string" ? body.label.trim() || null : undefined;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const guncelleme: Record<string, unknown> = {
    tenant_id: tenantId,
    assigned_at: tenantId ? new Date().toISOString() : null,
  };
  if (label !== undefined) {
    guncelleme.label = label;
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .update(guncelleme)
    .eq("id", id)
    .select("id, code, tenant_id, label, assigned_at, tenants(subdomain, company_name)")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Kod güncellenemedi." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Kod bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ code: data });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const { id } = await ctx.params;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  // Basılmış bir magnetin kodunu silmek onu kalıcı olarak öldürür; bu uç
  // yalnızca henüz bastırılmamış fazla kodlar için.
  const { error } = await supabase.from("magnet_codes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Kod silinemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
