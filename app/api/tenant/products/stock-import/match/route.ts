import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { matchStockImportRows, type StockImportMatchStatus } from "@/lib/products/stock-import-matching";
import { stockImportMatchRequestSchema } from "@/lib/validators/stock-import";

// Aynı PostgREST sayfalama sınırı import-from-catalog/route.ts'teki
// fetchAllTenantProducts'ta da var — 1000'in üzerindeki tenant'larda
// eşleştirme havuzu eksik kalmasın diye sayfalanarak çekiliyor.
async function fetchAllTenantProductsForMatching(supabase: SupabaseClient, tenantId: string) {
  const rows: Array<{ id: string; sku_code: string; product_name: string }> = [];
  const PAGE_SIZE = 1000;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("products")
      .select("id, sku_code, product_name")
      .eq("tenant_id", tenantId)
      .range(from, from + PAGE_SIZE - 1);

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = stockImportMatchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const products = await fetchAllTenantProductsForMatching(supabase, tenant.id);
  const results = matchStockImportRows(parsed.data.rows, products);

  const summary = results.reduce(
    (acc, result) => {
      acc.totalRows += 1;
      acc[summaryKeyForStatus(result.status)] += 1;
      return acc;
    },
    { totalRows: 0, matchedExact: 0, matchedFuzzyHigh: 0, needsReview: 0, noMatch: 0 },
  );

  return NextResponse.json({ productPool: products, results, summary });
}

function summaryKeyForStatus(
  status: StockImportMatchStatus,
): "matchedExact" | "matchedFuzzyHigh" | "needsReview" | "noMatch" {
  switch (status) {
    case "matched_exact":
      return "matchedExact";
    case "matched_fuzzy_high":
      return "matchedFuzzyHigh";
    case "needs_review":
      return "needsReview";
    case "no_match":
      return "noMatch";
  }
}
