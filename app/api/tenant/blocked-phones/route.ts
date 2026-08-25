import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";

// Telefon bazlı müşteri engelleme (bkz. 0087 blocked_customer_phones).
// Magneti pasife almak müşteriyi durdurmaz — kişi siteye doğrudan da
// girebilir; asıl engel bu tablo. generate-pdf PDF üretmeden 403 döner,
// RPC içinde ikinci bir savunma katmanı daha var.

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ phones: [] });

  const { data } = await supabase
    .from("blocked_customer_phones")
    .select("id, phone, reason, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ phones: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const body = await request.json().catch(() => null);
  const phone = normalizeCustomerPhone(
    typeof body?.phone === "string" ? body.phone : "",
  );
  const reason = typeof body?.reason === "string" ? body.reason.trim() || null : null;

  if (!phone) {
    return NextResponse.json({ error: "Geçerli bir telefon numarası girin." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase.from("blocked_customer_phones").insert({
    tenant_id: tenant.id,
    phone,
    reason,
    created_by: session.profile?.id ?? null,
  });

  if (error) {
    // 23505 = zaten engelli (tenant_id, phone benzersiz).
    const zaten = error.code === "23505";
    return NextResponse.json(
      { error: zaten ? "Bu numara zaten engelli." : "Numara engellenemedi." },
      { status: zaten ? 409 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Kayıt belirtilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase
    .from("blocked_customer_phones")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: "Engel kaldırılamadı." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
