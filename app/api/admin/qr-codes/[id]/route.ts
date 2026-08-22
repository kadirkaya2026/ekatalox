import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { normalizeMagnetCode } from "@/lib/magnet/codes";

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

  // KOD DÜZENLEME: yanlış basılmış ya da yanlış girilmiş bir kodu
  // düzeltebilmek için. Kod değişirse eski kodu taşıyan magnetler ölür,
  // o yüzden arayüzde uyarı gösteriliyor.
  let eskiKod: string | null = null;
  if (typeof body?.code === "string") {
    const parsed = normalizeMagnetCode(body.code);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data: mevcut } = await supabase
      .from("magnet_codes")
      .select("code")
      .eq("id", id)
      .maybeSingle();

    if (mevcut && mevcut.code.toLowerCase() !== parsed.code) {
      eskiKod = mevcut.code;
      guncelleme.code = parsed.code;
    }
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .update(guncelleme)
    .eq("id", id)
    .select("id, code, tenant_id, label, assigned_at, tenants(subdomain, company_name)")
    .maybeSingle();

  if (error) {
    // 23505 = benzersiz kısıt ihlali (lower(code) indeksi).
    const cakisma = error.code === "23505";
    return NextResponse.json(
      { error: cakisma ? "Bu kod zaten havuzda var." : "Kod güncellenemedi." },
      { status: cakisma ? 409 : 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Kod bulunamadı." }, { status: 404 });
  }

  // Okutma kayıtları slug (kod metni) üzerinden tutuluyor. Kod değişirse
  // eski kayıtlar yetim kalır ve sayaç sıfırlanmış gibi görünür; geçmişi
  // yeni koda taşıyoruz.
  if (eskiKod) {
    await supabase
      .from("magnet_scans")
      .update({ slug: data.code })
      .ilike("slug", eskiKod);
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
