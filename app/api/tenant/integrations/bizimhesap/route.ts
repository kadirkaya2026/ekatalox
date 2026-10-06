import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { testBizimHesapConnection } from "@/lib/integrations/bizimhesap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// BizimHesap bağlantı ayarları (0159). Firma kimliği yazılır ama ASLA geri
// döndürülmez; panel yalnız "kayıtlı" bilgisini ve son 4 haneyi görür.
export const dynamic = "force-dynamic";

async function loadConfig(tenantId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { supabase: null, config: null };
  const { data } = await supabase
    .from("tenant_bizimhesap")
    .select("firm_id, vat_rate, is_enabled, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return { supabase, config: data };
}

function publicView(config: { firm_id: string; vat_rate: number; is_enabled: boolean; updated_at: string } | null) {
  return {
    connected: Boolean(config?.firm_id),
    firmIdHint: config?.firm_id ? config.firm_id.slice(-4) : null,
    vatRate: config ? Number(config.vat_rate) : 20,
    isEnabled: config?.is_enabled ?? false,
    updatedAt: config?.updated_at ?? null,
  };
}

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const { config } = await loadConfig(session.tenant!.id);
  return NextResponse.json(publicView(config));
}

export async function PUT(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const body = (await request.json().catch(() => ({}))) as {
    firmId?: unknown;
    vatRate?: unknown;
    isEnabled?: unknown;
    disconnect?: unknown;
  };
  const { supabase, config } = await loadConfig(session.tenant!.id);
  if (!supabase) return NextResponse.json({ error: "Veritabanı yapılandırması eksik." }, { status: 500 });

  if (body.disconnect === true) {
    await supabase.from("tenant_bizimhesap").delete().eq("tenant_id", session.tenant!.id);
    return NextResponse.json(publicView(null));
  }

  const firmId = typeof body.firmId === "string" ? body.firmId.trim() : "";
  if (firmId && !/^[A-Za-z0-9-]{8,64}$/.test(firmId)) {
    return NextResponse.json({ error: "Firma kimliği geçersiz görünüyor." }, { status: 400 });
  }
  if (!firmId && !config) {
    return NextResponse.json({ error: "BizimHesap firma kimliğini girin." }, { status: 400 });
  }
  const vatRate = Number(body.vatRate ?? config?.vat_rate ?? 20);
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 50) {
    return NextResponse.json({ error: "KDV oranı 0 ile 50 arasında olmalı." }, { status: 400 });
  }

  const nextFirmId = firmId || config!.firm_id;
  if (firmId) {
    const test = await testBizimHesapConnection(nextFirmId);
    if (!test.ok) {
      return NextResponse.json({ error: `BizimHesap bağlantısı kurulamadı: ${test.message}` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("tenant_bizimhesap")
    .upsert(
      {
        tenant_id: session.tenant!.id,
        firm_id: nextFirmId,
        vat_rate: vatRate,
        is_enabled: typeof body.isEnabled === "boolean" ? body.isEnabled : (config?.is_enabled ?? true),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    )
    .select("firm_id, vat_rate, is_enabled, updated_at")
    .single();
  if (error) return NextResponse.json({ error: "Ayar kaydedilemedi." }, { status: 400 });
  return NextResponse.json(publicView(data));
}

export async function POST() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const { config } = await loadConfig(session.tenant!.id);
  if (!config) return NextResponse.json({ ok: false, message: "Önce firma kimliğini kaydedin." });
  return NextResponse.json(await testBizimHesapConnection(config.firm_id));
}
