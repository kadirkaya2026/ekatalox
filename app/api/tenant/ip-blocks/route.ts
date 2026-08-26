import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Bayinin IP engel yönetimi (bkz. 0090_storefront_ip_guard.sql).
// Engeller çoğunlukla taşkın freninin otomatik düşürdükleri; bayi buradan
// kaldırır, süresize çevirir ya da uzatır. Tüm sorgular tenant_id ile sınırlı.

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ blocks: [] });

  const { data } = await supabase
    .from("storefront_ip_blocks")
    .select("id, ip, reason, blocked_until, created_at, updated_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ blocks: data ?? [] });
}

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  const mode = body?.mode as "permanent" | "extend" | undefined;
  const hours = Math.floor(Number(body?.hours ?? 0));

  if (!id || (mode !== "permanent" && mode !== "extend")) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (mode === "extend" && (!Number.isFinite(hours) || hours < 1 || hours > 24 * 365)) {
    return NextResponse.json({ error: "Geçersiz süre." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const guncelleme: Record<string, unknown> = {
    reason: "manual", // bayi dokundu — artık otomatik değil, bilinçli karar
    created_by: session.profile?.id ?? null,
    updated_at: new Date().toISOString(),
  };

  if (mode === "permanent") {
    guncelleme.blocked_until = null;
  } else {
    // Uzatma "şu andan itibaren": süresi dolmuş ya da dolmak üzere olan
    // engelde kalan süreye eklemek kullanıcıyı şaşırtır.
    const { data: mevcut } = await supabase
      .from("storefront_ip_blocks")
      .select("blocked_until")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (!mevcut) {
      return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
    }

    const taban = Math.max(
      Date.now(),
      mevcut.blocked_until ? new Date(mevcut.blocked_until).getTime() : 0,
    );
    guncelleme.blocked_until = new Date(taban + hours * 60 * 60_000).toISOString();
  }

  const { data, error } = await supabase
    .from("storefront_ip_blocks")
    .update(guncelleme)
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Engel güncellenemedi." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
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
    .from("storefront_ip_blocks")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: "Engel kaldırılamadı." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
