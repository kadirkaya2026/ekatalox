import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { canCreatePriceList, getPlanLabel, getPriceListLimit } from "@/lib/billing/plans";
import { shouldAllowDemoFallback } from "@/lib/env";
import { fetchTenantPriceLists } from "@/lib/price-lists/data";
import { normalizePriceListRecord } from "@/lib/price-lists/records";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

const priceListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Liste adı zorunludur.")
    .max(60, "Liste adı en fazla 60 karakter olabilir."),
});

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = priceListSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Liste adı hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      priceList: {
        id: randomUUID(),
        tenant_id: tenant.id,
        name: parsed.data.name,
        is_catalog_only: false,
        sort_order: 999,
        created_at: new Date().toISOString(),
      },
    });
  }

  const existingLists = await fetchTenantPriceLists(supabase, tenant.id);
  const pricedCount = existingLists.filter((list) => !list.is_catalog_only).length;

  if (!canCreatePriceList(tenant.plan, pricedCount)) {
    const limit = getPriceListLimit(tenant.plan);
    return NextResponse.json(
      {
        error: `${getPlanLabel(tenant.plan)} paketinde en fazla ${limit} fiyatlı seviye oluşturabilirsiniz. Daha fazlası için paketinizi yükseltin.`,
      },
      { status: 403 },
    );
  }

  const nextSortOrder =
    existingLists.reduce((max, list) => Math.max(max, list.sort_order), 0) + 1;

  const { data, error } = await supabase
    .from("price_lists")
    .insert({
      id: randomUUID(),
      tenant_id: tenant.id,
      name: parsed.data.name,
      is_catalog_only: false,
      sort_order: nextSortOrder,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Fiyat listesi eklenemedi." }, { status: 400 });
  }

  return NextResponse.json({ priceList: normalizePriceListRecord(data) });
}
