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

  const label = typeof body?.label === "string" ? body.label.trim() || null : undefined;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const guncelleme: Record<string, unknown> = {};

  // Atamaya YALNIZCA gövdede tenant_id anahtarı varsa dokunulur. Eski davranış
  // anahtarsız her PATCH'te atamayı kaldırıyordu; is_disabled gibi tekil alan
  // güncellemeleri bu yüzden yanlışlıkla kodu havuza döndürebilirdi.
  if (body && Object.prototype.hasOwnProperty.call(body, "tenant_id")) {
    const tenantId =
      typeof body.tenant_id === "string" && body.tenant_id.trim()
        ? body.tenant_id.trim()
        : null;
    guncelleme.tenant_id = tenantId;
    guncelleme.assigned_at = tenantId ? new Date().toISOString() : null;
  }

  // Pasife alma / geri açma. Kim kapattıysa kayıtta dursun: bayi, süper
  // adminin kapattığını görebilsin (bkz. 0087 disabled_by_role).
  if (typeof body?.is_disabled === "boolean") {
    guncelleme.is_disabled = body.is_disabled;
    guncelleme.disabled_at = body.is_disabled ? new Date().toISOString() : null;
    guncelleme.disabled_by_role = body.is_disabled ? "super_admin" : null;
  }

  if (label !== undefined) {
    guncelleme.label = label;
  }

  // Konum alanları: gövdede varsa güncellenir, yoksa dokunulmaz.
  for (const alan of ["city", "district", "neighborhood"] as const) {
    if (typeof body?.[alan] === "string") {
      guncelleme[alan] = body[alan].trim() || null;
    }
  }

  // Mahalle girildiği an magnet fiilen sahaya bırakılmış sayılıyor;
  // "kaç magnet dağıtıldı" sorusunun cevabı bu.
  if (typeof body?.neighborhood === "string" && body.neighborhood.trim()) {
    guncelleme.placed_at = new Date().toISOString();
  }

  // KOD DÜZENLEME: yanlış basılmış ya da yanlış girilmiş bir kodu
  // düzeltebilmek için. Kod değişirse eski kodu taşıyan magnetler ölür,
  // o yüzden arayüzde uyarı gösteriliyor.
  // Okutma geçmişi artık magnet_code_id FK'sı üzerinden bağlı (0087);
  // kod metni değişse de geçmiş ve sayaç bozulmaz, slug taşıma gerekmez.
  if (typeof body?.code === "string") {
    const parsed = normalizeMagnetCode(body.code);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    guncelleme.code = parsed.code;
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .update(guncelleme)
    .eq("id", id)
    .select(
      "id, code, tenant_id, label, assigned_at, city, district, neighborhood, placed_at, is_disabled, scan_count, last_scan_at, customer_id, claimed_at, tenants(subdomain, company_name)",
    )
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
