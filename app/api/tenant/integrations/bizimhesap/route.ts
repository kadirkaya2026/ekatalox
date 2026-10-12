import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { resolveBizimHesapPolicy, testBizimHesapConnection, isBizimHesapBusinessAllowed, fetchBizimHesapWarehouses } from "@/lib/integrations/bizimhesap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse, ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

// BizimHesap bağlantı ayarları (0159). Firma kimliği yazılır ama ASLA geri
// döndürülmez; panel yalnız "kayıtlı" bilgisini ve son 4 haneyi görür.
export const dynamic = "force-dynamic";

async function loadConfig(tenantId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { supabase: null, config: null };
  const { data } = await supabase
    .from("tenant_bizimhesap")
    .select("firm_id, vat_rate, is_enabled, send_on, fixed_customer_title, require_product_match, default_warehouse_id, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return { supabase, config: data };
}

type ConfigRow = {
  firm_id: string;
  vat_rate: number;
  is_enabled: boolean;
  send_on?: string | null;
  fixed_customer_title?: string | null;
  require_product_match?: boolean | null;
  default_warehouse_id?: string | null;
  updated_at: string;
};

async function publicView(tenantId: string, config: ConfigRow | null) {
  const policy = resolveBizimHesapPolicy(tenantId, config);
  // Depo listesi (varsayılan depo seçimi için); bağlantı yoksa boş.
  const warehouses = config?.firm_id ? (await fetchBizimHesapWarehouses(config.firm_id)) ?? [] : [];
  return {
    warehouses,
    defaultWarehouseId: config?.default_warehouse_id ?? null,
    connected: Boolean(config?.firm_id),
    firmIdHint: config?.firm_id ? config.firm_id.slice(-4) : null,
    vatRate: config ? Number(config.vat_rate) : 20,
    isEnabled: config?.is_enabled ?? false,
    sendOn: policy.sendOn,
    fixedCustomerTitle: policy.fixedCustomerTitle ?? "",
    requireProductMatch: policy.requireProductMatch,
    rulesLocked: policy.locked,
    updatedAt: config?.updated_at ?? null,
  };
}

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  if (!isBizimHesapBusinessAllowed(session.tenant!)) return NextResponse.json({ error: "BizimHesap entegrasyonu yalnız toptancı mağazalarda kullanılabilir." }, { status: 403 });
  const { config } = await loadConfig(session.tenant!.id);
  return NextResponse.json(await publicView(session.tenant!.id, config));
}

export async function PUT(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const planGuard = await ensureTenantPlanFeatureResponse("bizimhesap");
  if (planGuard) return planGuard;
  const session = await getSessionContext();
  if (!isBizimHesapBusinessAllowed(session.tenant!)) return NextResponse.json({ error: "BizimHesap entegrasyonu yalnız toptancı mağazalarda kullanılabilir." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as {
    firmId?: unknown;
    vatRate?: unknown;
    isEnabled?: unknown;
    disconnect?: unknown;
    sendOn?: unknown;
    fixedCustomerTitle?: unknown;
    requireProductMatch?: unknown;
    defaultWarehouseId?: unknown;
  };
  const { supabase, config } = await loadConfig(session.tenant!.id);
  if (!supabase) return NextResponse.json({ error: "Veritabanı yapılandırması eksik." }, { status: 500 });

  if (body.disconnect === true) {
    await supabase.from("tenant_bizimhesap").delete().eq("tenant_id", session.tenant!.id);
    return NextResponse.json(await publicView(session.tenant!.id, null));
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
  // Sabit kurallı mağazada (Lucatech) kurallar panelden değiştirilemez; DB'ye de sabit değer yazılır.
  const locked = resolveBizimHesapPolicy(session.tenant!.id, null);
  if (firmId) {
    const test = await testBizimHesapConnection(nextFirmId);
    if (!test.ok) {
      return NextResponse.json({ error: `BizimHesap bağlantısı kurulamadı: ${test.message}` }, { status: 400 });
    }
  }

  // Varsayılan depo (0172): BizimHesap'ta var olan bir depo ya da boş (eski davranış).
  let defaultWarehouseId: string | null | undefined;
  if ("defaultWarehouseId" in body) {
    const wanted = typeof body.defaultWarehouseId === "string" ? body.defaultWarehouseId.trim() : "";
    if (wanted) {
      const known = await fetchBizimHesapWarehouses(nextFirmId);
      if (!known) return NextResponse.json({ error: "BizimHesap depo listesi alınamadı; tekrar deneyin." }, { status: 502 });
      if (!known.some((w) => w.id === wanted)) return NextResponse.json({ error: "Seçilen depo BizimHesap'ta bulunamadı." }, { status: 400 });
    }
    defaultWarehouseId = wanted || null;
  }

  const { data, error } = await supabase
    .from("tenant_bizimhesap")
    .upsert(
      {
        tenant_id: session.tenant!.id,
        firm_id: nextFirmId,
        vat_rate: vatRate,
        is_enabled: typeof body.isEnabled === "boolean" ? body.isEnabled : (config?.is_enabled ?? true),
        send_on: locked.locked
          ? locked.sendOn
          : body.sendOn === "confirmed" || body.sendOn === "order"
            ? body.sendOn
            : (config?.send_on ?? "order"),
        fixed_customer_title: locked.locked
          ? locked.fixedCustomerTitle
          : typeof body.fixedCustomerTitle === "string"
            ? body.fixedCustomerTitle.trim().slice(0, 120) || null
            : (config?.fixed_customer_title ?? null),
        require_product_match: locked.locked
          ? true
          : typeof body.requireProductMatch === "boolean"
            ? body.requireProductMatch
            : Boolean(config?.require_product_match),
        default_warehouse_id: defaultWarehouseId !== undefined ? defaultWarehouseId : (config?.default_warehouse_id ?? null),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    )
    .select("firm_id, vat_rate, is_enabled, send_on, fixed_customer_title, require_product_match, default_warehouse_id, updated_at")
    .single();
  if (error) return NextResponse.json({ error: "Ayar kaydedilemedi." }, { status: 400 });
  return NextResponse.json(await publicView(session.tenant!.id, data));
}

export async function POST() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  if (!isBizimHesapBusinessAllowed(session.tenant!)) return NextResponse.json({ error: "BizimHesap entegrasyonu yalnız toptancı mağazalarda kullanılabilir." }, { status: 403 });
  const { config } = await loadConfig(session.tenant!.id);
  if (!config) return NextResponse.json({ ok: false, message: "Önce firma kimliğini kaydedin." });
  return NextResponse.json(await testBizimHesapConnection(config.firm_id));
}
