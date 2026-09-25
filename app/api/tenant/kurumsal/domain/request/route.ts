import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import {
  cancelDomainRequest,
  createDomainRequest,
  getPendingDomainRequest,
  sendDomainRequestEmail,
} from "@/lib/kurumsal/domain-requests";
import { buildSearchCandidates } from "@/lib/kurumsal/domain-search";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

// Alan adı talebi (domain_requests, 0135).
// GET    : bekleyen talep (varsa)
// POST   : { domain, price?, period?, available? } → kaydet + ekibe e-posta.
//          kurumsal_domain'e DOKUNMAZ: önce ekip alır, sonra bağlar.
// DELETE : bekleyen talebi iptal et.

const postSchema = z.object({
  domain: z.string().trim().min(3).max(253),
  price: z.number().min(0).max(100_000).nullable().optional(),
  period: z.number().int().min(1).max(10).nullable().optional(),
  available: z.boolean().nullable().optional(),
  // Yalnız yerel test: konuya "[TEST]" ekler (üretimde etkisiz kalsın diye env'e bağlı).
  test: z.boolean().optional(),
});

export async function GET() {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site");
  if (guard) return guard;
  const session = await getSessionContext();
  const request = await getPendingDomainRequest(session.tenant!.id);
  return NextResponse.json({ request }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site", { blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Alan adı bilgisi hatalı." }, { status: 400 });

  // Aynı normalizasyon: tam bir alan adı (uzantılı) olmalı.
  const candidates = buildSearchCandidates(parsed.data.domain);
  if (!candidates.ok || candidates.domains.length !== 1) {
    return NextResponse.json({ error: "Uzantısıyla birlikte tam bir alan adı seçin. Örn: firmaniz.com" }, { status: 400 });
  }
  const domain = candidates.domains[0];

  const existing = await getPendingDomainRequest(tenant.id);
  if (existing) {
    return NextResponse.json(
      { error: `Zaten bekleyen bir talebiniz var: ${existing.domain}. Yeni talep için önce onu iptal edin.` },
      { status: 409 },
    );
  }

  const created = await createDomainRequest({
    tenantId: tenant.id,
    domain,
    priceUsd: parsed.data.price ?? null,
    periodYears: parsed.data.period ?? null,
    note:
      parsed.data.available === true
        ? "Talep anında boşta görünüyordu."
        : parsed.data.available === false
          ? "Talep anında dolu görünüyordu."
          : "Talep anında müsaitlik kontrol edilemedi.",
  });
  if (!created.ok) return NextResponse.json({ error: created.error }, { status: 500 });

  const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
  const email = await sendDomainRequestEmail({
    tenant,
    contactPhone: settings?.footer_phone ?? null,
    domain,
    available: parsed.data.available ?? null,
    priceUsd: parsed.data.price ?? null,
    periodYears: parsed.data.period ?? null,
    testMarker: Boolean(parsed.data.test) && process.env.NODE_ENV !== "production",
  });

  return NextResponse.json({ request: created.request, emailSent: email.sent }, { status: 201 });
}

export async function DELETE() {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site", { blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const existing = await getPendingDomainRequest(tenant.id);
  if (!existing) return NextResponse.json({ request: null });
  const ok = await cancelDomainRequest(tenant.id, existing.id);
  if (!ok) return NextResponse.json({ error: "Talep iptal edilemedi." }, { status: 500 });
  return NextResponse.json({ request: null });
}
