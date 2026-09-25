import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import { defaultKurumsalContent, kurumsalContentSchema } from "@/lib/kurumsal/schema";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { getKurumsalSite, getKurumsalSiteRow } from "@/lib/storefront/kurumsal-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse, ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

// Panel → Ayarlar → Kurumsal Site (yazma yalnız "kurumsal_site" paketinde). GET: kayıtlı içerik (yoksa varsayılan
// taslak), PUT: içeriği kaydet (upsert). is_published gönderilmezse mevcut
// yayın durumu korunur — sihirbaz her adımda böyle kaydeder, kapatılsa da
// iş kaybolmaz. Yayına alınırken published_at yazılır. Kayıttan sonra
// vitrin önbelleği (storefront_{tenantId} + /kurumsal yolu) tazelenir.

const putSchema = z.object({
  content: kurumsalContentSchema,
  is_published: z.boolean().optional(),
});

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const [site, settings] = await Promise.all([
    getKurumsalSite(tenant.id),
    getTenantStorefrontSettings(tenant.id),
  ]);

  return NextResponse.json(
    {
      site,
      defaults: defaultKurumsalContent(tenant, settings),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  // Kurumsal site yalnız "kurumsal_site" paketinde (bkz. lib/billing/plans.ts).
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site", { blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Kurumsal site bilgileri hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const existing = await getKurumsalSiteRow(tenant.id);
  const isPublished = parsed.data.is_published ?? existing?.is_published ?? false;
  const now = new Date().toISOString();
  const publishedAt = isPublished
    ? existing?.is_published && existing.published_at
      ? existing.published_at
      : now
    : (existing?.published_at ?? null);

  const { data, error } = await supabase
    .from("tenant_kurumsal_sites")
    .upsert(
      {
        tenant_id: tenant.id,
        is_published: isPublished,
        content: parsed.data.content,
        published_at: publishedAt,
        updated_at: now,
      },
      { onConflict: "tenant_id" },
    )
    .select("is_published, content, published_at, updated_at")
    .single();

  if (error || !data) {
    console.error("[kurumsal] kaydedilemedi:", error?.message);
    return NextResponse.json({ error: "Kurumsal site kaydedilemedi." }, { status: 500 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ site: data });
}
