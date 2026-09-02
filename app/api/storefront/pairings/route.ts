import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// "Yanında iyi gider" eşlemeleri. Salt kategori id'leri döner (kişisel veri
// yok); 5 dk CDN önbelleği yeterli — eşlemeler nadiren değişir.
export async function GET(request: Request) {
  const subdomain = new URL(request.url).searchParams.get("subdomain")?.trim().toLowerCase() ?? "";
  if (!subdomain) return NextResponse.json({ pairings: [] });
  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant || tenant.status !== "active") return NextResponse.json({ pairings: [] });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ pairings: [] });
  const { data } = await supabase
    .from("category_pairings")
    .select("source_category_id, target_category_id, priority")
    .eq("tenant_id", tenant.id)
    .order("priority");
  return NextResponse.json(
    { pairings: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
