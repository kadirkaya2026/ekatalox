import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { parseProductsCsv } from "@/lib/csv/parse-products";
import { getTenantProducts } from "@/lib/data";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { csvText } = await request.json();
  const parsed = parseProductsCsv(String(csvText ?? ""));

  if (parsed.errors.length) {
    return NextResponse.json(
      { error: parsed.errors[0] ?? "CSV dosyası doğrulanamadı." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    const currentProducts = await getTenantProducts(tenant.id);
    const mappedProducts = parsed.rows.map((row, index) => ({
      id: `demo-import-${index}-${row.sku_code}`,
      tenant_id: tenant.id,
      created_at: new Date().toISOString(),
      ...row,
    }));
    const merged = [...mappedProducts, ...currentProducts.filter((product) => {
      return !parsed.rows.some((row) => row.sku_code === product.sku_code);
    })];

    return NextResponse.json({
      count: parsed.rows.length,
      products: merged,
    });
  }

  const { data: existingRows } = await supabase
    .from("products")
    .select("sku_code")
    .eq("tenant_id", tenant.id);

  const existingSkuSet = new Set(
    ((existingRows as Array<{ sku_code: string }> | null) ?? []).map((item) => item.sku_code),
  );

  const newSkuCount = parsed.rows.filter((row) => !existingSkuSet.has(row.sku_code)).length;

  if (existingSkuSet.size + newSkuCount > tenant.max_product_limit) {
    return NextResponse.json(
      { error: "CSV içeriği ürün limitini aşıyor." },
      { status: 400 },
    );
  }

  const payload = parsed.rows.map((row) => ({
    tenant_id: tenant.id,
    ...row,
  }));

  const { error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "tenant_id,sku_code" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    count: parsed.rows.length,
    products: data ?? [],
  });
}