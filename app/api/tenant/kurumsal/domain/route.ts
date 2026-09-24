import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { normalizeKurumsalDomain, validateKurumsalDomain } from "@/lib/kurumsal/domain";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import {
  connectKurumsalDomain,
  disconnectKurumsalDomain,
  getKurumsalDomainStatus,
} from "@/lib/vercel/domains";

// Ayarlar → Kurumsal Site → Alan adı (yalnız "kurumsal_site" paketi).
// GET   : bağlı alan adı + Vercel doğrulama/DNS durumu ("Kontrol et")
// PUT   : { domain } normalize + doğrula + benzersizlik → tenants.kurumsal_domain;
//         Vercel projesine kök + www eklenir (eski alan adı kaldırılır).
// DELETE: alan adını kaldır (Vercel'den de).
// Vercel env'i yoksa alan adı yine kaydedilir; yanıt configured:false döner,
// panel "bağlantı eKatalox ekibi tarafından tamamlanacak" gösterir.

async function currentDomain(tenantId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { supabase: null, domain: null as string | null };
  const { data } = await supabase.from("tenants").select("kurumsal_domain").eq("id", tenantId).maybeSingle();
  return { supabase, domain: ((data as { kurumsal_domain?: string | null } | null)?.kurumsal_domain ?? null) as string | null };
}

export async function GET() {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site");
  if (guard) return guard;
  const session = await getSessionContext();
  const { domain } = await currentDomain(session.tenant!.id);
  if (!domain) return NextResponse.json({ domain: null, status: null }, { headers: { "Cache-Control": "no-store" } });
  const status = await getKurumsalDomainStatus(domain);
  return NextResponse.json({ domain, status }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site", { blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = (await request.json().catch(() => null)) as { domain?: unknown } | null;
  const raw = typeof body?.domain === "string" ? body.domain : "";

  const validation = validateKurumsalDomain(raw);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const domain = validation.value;
  if (!domain) return NextResponse.json({ error: "Alan adını yazın. Örn: firmaniz.com" }, { status: 400 });

  const ownCatalog = normalizeKurumsalDomain(tenant.custom_domain);
  if (ownCatalog && (ownCatalog === domain || tenant.custom_domain?.trim().toLowerCase() === domain)) {
    return NextResponse.json(
      { error: "Bu alan adı katalog/sipariş adresiniz olarak kullanılıyor; kurumsal site için başka bir alan adı girin." },
      { status: 400 },
    );
  }

  const { supabase, domain: previous } = await currentDomain(tenant.id);
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  // Başka bir mağazanın katalog ya da kurumsal alan adı olamaz.
  const [{ data: catalogOwner }, { data: kurumsalOwner }] = await Promise.all([
    supabase.from("tenants").select("id").or(`custom_domain.eq.${domain},custom_domain.eq.www.${domain}`).neq("id", tenant.id).limit(1),
    supabase.from("tenants").select("id").eq("kurumsal_domain", domain).neq("id", tenant.id).limit(1),
  ]);
  if (catalogOwner?.length || kurumsalOwner?.length) {
    return NextResponse.json({ error: "Bu alan adı başka bir mağaza tarafından kullanılıyor." }, { status: 409 });
  }

  const { error } = await supabase.from("tenants").update({ kurumsal_domain: domain }).eq("id", tenant.id);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu alan adı başka bir mağaza tarafından kullanılıyor." }, { status: 409 });
    }
    console.error("[kurumsal-domain] kaydedilemedi:", error.message);
    return NextResponse.json({ error: "Alan adı kaydedilemedi." }, { status: 500 });
  }

  if (previous && previous !== domain) await disconnectKurumsalDomain(previous);
  const connect = await connectKurumsalDomain(domain);
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  const status = await getKurumsalDomainStatus(domain);
  return NextResponse.json({
    domain,
    status,
    ...(connect.configured && !connect.ok ? { warning: `Vercel'e eklenemedi: ${connect.reason ?? "bilinmeyen hata"}` } : {}),
  });
}

export async function DELETE() {
  const guard = await ensureTenantPlanFeatureResponse("kurumsal_site", { blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { supabase, domain } = await currentDomain(tenant.id);
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { error } = await supabase.from("tenants").update({ kurumsal_domain: null }).eq("id", tenant.id);
  if (error) return NextResponse.json({ error: "Alan adı kaldırılamadı." }, { status: 500 });
  if (domain) await disconnectKurumsalDomain(domain);
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  return NextResponse.json({ domain: null, status: null });
}
