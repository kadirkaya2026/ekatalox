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
import { revalidateStorefrontCache } from "@/lib/storefront/cache";

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

// Fiyat listesini silme (7 Eki 2026). Ürünlerin bu listedeki fiyatları
// (product_prices, product_variant_prices) cascade ile silinir. Şifre bağlı
// listeler silinmez (access_codes FK restrict): önce şifreler kaldırılmalı.
export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenantId = session.tenant!.id;
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "Silinecek liste seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const lists = await fetchTenantPriceLists(supabase, tenantId);
  const list = lists.find((entry) => entry.id === id);

  if (!list) {
    return NextResponse.json({ error: "Fiyat listesi bulunamadı." }, { status: 404 });
  }

  if (list.is_catalog_only) {
    return NextResponse.json({ error: "Fiyatsız Katalog listesi silinemez." }, { status: 400 });
  }

  if (lists.filter((entry) => !entry.is_catalog_only).length <= 1) {
    return NextResponse.json({ error: "En az bir fiyat listesi kalmalıdır." }, { status: 400 });
  }

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("public_price_list_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantRow?.public_price_list_id === id) {
    return NextResponse.json(
      {
        error:
          "Şifresiz vitrininiz bu listenin fiyatlarını gösteriyor. Önce şifresiz vitrin için başka bir liste seçin.",
      },
      { status: 409 },
    );
  }

  const { count: codeCount } = await supabase
    .from("access_codes")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("price_list_id", id);

  if ((codeCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Bu listeye bağlı ${codeCount} şifre/müşteri var. Önce şifreleri kaldırın ya da müşterileri başka listeye taşıyın.`,
      },
      { status: 409 },
    );
  }

  // "Bu listede gizle" (0162) dizilerinde kalan kimliği temizle.
  const { data: hiddenRows } = await supabase
    .from("products")
    .select("id, hidden_price_list_ids")
    .eq("tenant_id", tenantId)
    .contains("hidden_price_list_ids", [id]);

  for (const row of (hiddenRows ?? []) as Array<{ id: string; hidden_price_list_ids: string[] | null }>) {
    await supabase
      .from("products")
      .update({ hidden_price_list_ids: (row.hidden_price_list_ids ?? []).filter((value) => value !== id) })
      .eq("id", row.id)
      .eq("tenant_id", tenantId);
  }

  const { error } = await supabase.from("price_lists").delete().eq("id", id).eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: "Fiyat listesi silinemedi." }, { status: 400 });
  }

  revalidateStorefrontCache({ tenantId, subdomain: session.tenant!.subdomain });
  return NextResponse.json({ success: true });
}
