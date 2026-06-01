import { NextResponse } from "next/server";
import { canCreatePriceList, getPriceListLimit } from "@/lib/billing/plans";
import {
  countPricedLists,
  ensureDefaultPriceListsForTenant,
  fetchTenantPriceLists,
} from "@/lib/price-lists/data";
import { getPricedLists } from "@/lib/price-lists/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import {
  priceListCreateSchema,
  priceListDeleteSchema,
  priceListUpdateSchema,
} from "@/lib/validators/price-list";

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ priceLists: [], limit: null, pricedCount: 0 });
  }

  const priceLists = await ensureDefaultPriceListsForTenant(supabase, tenant.id);
  const pricedCount = countPricedLists(priceLists);

  return NextResponse.json({
    priceLists,
    limit: getPriceListLimit(tenant.plan ?? "baslangic"),
    pricedCount,
    canCreate: canCreatePriceList(tenant.plan ?? "baslangic", pricedCount),
  });
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = priceListCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Liste verisi hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const priceLists = await ensureDefaultPriceListsForTenant(supabase, tenant.id);
  const pricedLists = getPricedLists(priceLists);

  if (!canCreatePriceList(tenant.plan ?? "baslangic", pricedLists.length)) {
    return NextResponse.json(
      { error: "Paketinizdeki fiyat listesi limitine ulaştınız." },
      { status: 403 },
    );
  }

  const nextSortOrder =
    pricedLists.reduce((max, list) => Math.max(max, list.sort_order), 0) + 1;

  const { data, error } = await supabase
    .from("price_lists")
    .insert({
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

  return NextResponse.json({ priceList: data });
}

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = priceListUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Liste verisi hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("price_lists")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Liste bulunamadı." }, { status: 404 });
  }

  if (existing.is_catalog_only) {
    return NextResponse.json(
      { error: "Fiyatsız katalog listesi düzenlenemez." },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) {
    payload.name = parsed.data.name;
  }

  if (parsed.data.sort_order !== undefined) {
    payload.sort_order = parsed.data.sort_order;
  }

  const { data, error } = await supabase
    .from("price_lists")
    .update(payload)
    .eq("id", parsed.data.id)
    .eq("tenant_id", tenant.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Liste güncellenemedi." }, { status: 400 });
  }

  return NextResponse.json({ priceList: data });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = priceListDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Liste seçilmedi." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("price_lists")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Liste bulunamadı." }, { status: 404 });
  }

  if (existing.is_catalog_only) {
    return NextResponse.json(
      { error: "Fiyatsız katalog listesi silinemez." },
      { status: 400 },
    );
  }

  const { count: linkedCodeCount } = await supabase
    .from("access_codes")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("price_list_id", parsed.data.id);

  if ((linkedCodeCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Bu listeye bağlı erişim kodları var. Önce kodları güncelleyin." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("price_lists")
    .delete()
    .eq("id", parsed.data.id)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: "Liste silinemedi." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
