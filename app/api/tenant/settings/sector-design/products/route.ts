import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ELECTRONICS_SECTOR } from "@/lib/storefront/sector-design/config";
export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const { tenant } = await getSessionContext();
  if (tenant?.sector !== ELECTRONICS_SECTOR) return NextResponse.json({ error: "Bu sektör için kullanılamaz." }, { status: 403 });
  const db = createSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Ürünler okunamadı." }, { status: 503 });
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 100).replace(/[%_\\]/g, "");
  let query = db.from("products").select("id, product_name").eq("tenant_id", tenant.id).order("product_name").limit(50);
  if (q) query = query.ilike("product_name", `%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Ürünler okunamadı." }, { status: 503 });
  return NextResponse.json({ products: data.map(p => ({ id: p.id, name: p.product_name })) });
}
