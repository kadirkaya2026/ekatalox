import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/data";
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

  const { error } = await supabase.rpc("record_storefront_analytics", {
    p_tenant_id: tenant.id,
    p_event: parsed.data.event,
    p_product_id: parsed.data.productId ?? null,
    p_visitor_key: parsed.data.visitorKey ?? null,
  });

  if (error) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}
