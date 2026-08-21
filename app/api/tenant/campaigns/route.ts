import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { campaignSchema } from "@/lib/validators/campaign";

// Bayinin kendi kampanyaları (bkz. 0081_tenant_campaigns.sql). Vitrin
// tarafındaki okuma lib/data.ts -> getStorefrontCampaigns; burası sadece
// tenant admin panelini besliyor.
//
// Admin client RLS'i atladığı için tenant_id HER sorguda açıkça
// filtreleniyor — oturumdaki tenant dışına yazma/okuma olmasın.

const CAMPAIGN_LIMIT = 30;

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ campaigns: [] });
  }

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .select("*")
    .eq("tenant_id", session.tenant!.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Kampanyalar okunamadı." }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Kampanya verisi hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { count } = await supabase
    .from("tenant_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenant!.id);

  if ((count ?? 0) >= CAMPAIGN_LIMIT) {
    return NextResponse.json(
      { error: `En fazla ${CAMPAIGN_LIMIT} kampanya ekleyebilirsiniz.` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .insert({ ...parsed.data, tenant_id: session.tenant!.id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Kampanya kaydedilemedi." }, { status: 500 });
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ campaign: data });
}
