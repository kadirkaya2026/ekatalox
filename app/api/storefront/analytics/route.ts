import { NextResponse } from "next/server";
import { normalizeSearchQuery } from "@/lib/analytics/normalize-search-query";
import { resolveProvinceCodeFromHeaders } from "@/lib/analytics/provinces";
import { recordStorefrontSearchStat } from "@/lib/analytics/record-stats";
import { getStorefrontTenant } from "@/lib/data";
import { readStorefrontPriceList } from "@/lib/storefront/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { storefrontAnalyticsEventSchema } from "@/lib/validators/analytics";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = storefrontAnalyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const tenant = await getStorefrontTenant(parsed.data.subdomain);

  if (!tenant || tenant.status !== "active") {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return new NextResponse(null, { status: 204 });
  }

  if (parsed.data.event === "search") {
    const query = normalizeSearchQuery(parsed.data.query ?? "");

    if (query.length < 2) {
      return new NextResponse(null, { status: 204 });
    }

    const { error } = await recordStorefrontSearchStat(
      supabase,
      tenant.id,
      query,
      (parsed.data.resultCount ?? 0) === 0,
    );

    if (error) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(null, { status: 204 });
  }

  if (parsed.data.productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", parsed.data.productId)
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (!product) {
      return new NextResponse(null, { status: 204 });
    }
  }

  const baseArgs = {
    p_tenant_id: tenant.id,
    p_event: parsed.data.event,
    p_product_id: parsed.data.productId ?? null,
    p_visitor_key: parsed.data.visitorKey ?? null,
  };

  // İl kodu (0116): yalnız ziyaret olayında anlamlı. Migration henüz
  // uygulanmamışsa RPC beş parametreyi tanımaz; eski imzayla tekrar dene.
  const isVisit = parsed.data.event === "visit";
  const provinceCode = isVisit ? resolveProvinceCodeFromHeaders(request.headers) : null;

  // Hangi şifreyle hangi listeye girdi (0117): kapı çerezinden. Beacon aynı
  // origin'e gittiği için çerez gelir; tenant uyuşmazsa (eski/başka mağaza) yok say.
  const entry = isVisit ? await readStorefrontPriceList(parsed.data.subdomain) : null;
  const entryValid = entry?.tenantId === tenant.id;
  const priceListId = entryValid && entry?.priceListId ? entry.priceListId : null;
  const accessCodeId = entryValid && entry?.accessCodeId ? entry.accessCodeId : null;

  const { error } = await supabase.rpc("record_storefront_analytics", {
    ...baseArgs,
    p_province_code: provinceCode,
    p_price_list_id: priceListId,
    p_access_code_id: accessCodeId,
  });

  if (error) {
    // Eski imza (0116) hâlâ yayındaysa liste/şifre olmadan kaydet.
    const { error: fallbackError } = await supabase.rpc("record_storefront_analytics", {
      ...baseArgs,
      p_province_code: provinceCode,
    });
    if (fallbackError) {
      await supabase.rpc("record_storefront_analytics", baseArgs);
    }
  }

  return new NextResponse(null, { status: 204 });
}
