import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { campaignSchema } from "@/lib/validators/campaign";

// Admin client RLS'i atladığı için her sorguda tenant_id de eşleştiriliyor;
// aksi halde başka bayinin kampanya id'si gönderilerek düzenlenebilirdi.

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tenant/campaigns/[id]">,
) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { id } = await ctx.params;
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

  const { data, error } = await supabase
    .from("tenant_campaigns")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Kampanya güncellenemedi." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 });
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ campaign: data });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/tenant/campaigns/[id]">,
) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { id } = await ctx.params;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase
    .from("tenant_campaigns")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);

  if (error) {
    return NextResponse.json({ error: "Kampanya silinemedi." }, { status: 500 });
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ ok: true });
}
