import { NextResponse } from "next/server";
import { getStorefrontTenantCached } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appEnv } from "@/lib/env";

// Basılı QR'ların gittiği kısa adres: ekatalox.com/t/{subdomain}
//
// Magnet bir kez basılıyor ve yıllarca buzdolabında duruyor; oraya bayinin
// vitrin adresini doğrudan yazmak bu yüzden riskli. Bayi kendi alan adına
// geçerse, subdomain'i değişirse ya da vitrin başka bir yere taşınırsa
// basılmış her magnet ölür. Aradaki bu yönlendirme sayesinde hedef bizim
// tarafımızda güncellenebilir kalıyor.
//
// İkinci faydası ölçüm: her okutma kaydediliyor, böylece "magnetten kaç kişi
// geldi" sorusunun cevabı oluyor — yenileme görüşmesinde en somut kanıt.

// Yönlendirme her istekte tenant'ın güncel adresine bakmalı.
export const dynamic = "force-dynamic";

// RouteContext<"/t/[slug]"> Next'in derleme sırasında ürettiği tip haritasına
// dayanıyor ve yeni bir route ilk build'e kadar orada olmuyor; params burada
// açıkça yazıldı.
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const normalized = slug.trim().toLowerCase();

  // Önce kod havuzuna bak (bkz. 0084_magnet_codes.sql): magnetler bayi belli
  // olmadan basılabilsin diye kod ile tenant arasına eşleştirme katmanı
  // konuldu. Havuzda kayıt yoksa eski davranışa düşülür ve slug doğrudan
  // subdomain sayılır — daha önce basılmış /t/lucatech magnetleri çalışmaya
  // devam eder.
  const code = normalized ? await lookupMagnetCode(normalized) : null;

  if (code && !code.tenantId) {
    // Kod üretilmiş ama henüz bir bayiye atanmamış. Okutmayı yine de
    // sayıyoruz: magnet sahada mı, kaç kişi denedi?
    void recordScan(null, normalized, request);
    return redirectTo(
      `https://${appEnv.marketingDomain}/magaza-yakinda?kod=${encodeURIComponent(normalized)}`,
    );
  }

  const tenant = code?.tenantId
    ? await getStorefrontTenantById(code.tenantId)
    : normalized
      ? await getStorefrontTenantCached(normalized)
      : null;

  // Elinde magnet olan bir müşteriye hata sayfası göstermenin anlamı yok:
  // slug yanlışsa ya da bayi kapandıysa tanıtım sitesine düşsün.
  if (!tenant || tenant.status !== "active") {
    return redirectTo(`https://${appEnv.marketingDomain}`);
  }

  const target = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;

  // Kayıt en iyi çaba: analitik yazımı yavaşlarsa ya da patlarsa müşteri yine
  // vitrine gitmeli. Bu yüzden beklenmiyor ve hatası yutuluyor.
  void recordScan(tenant.id, normalized, request);

  return redirectTo(target);
}

function redirectTo(url: string) {
  // 302, 301 DEĞİL. Kalıcı yönlendirme tarayıcıda süresiz önbelleğe alınır:
  // bayi alan adını değiştirdiğinde eski hedef yapışıp kalır ve o cihazdan
  // gelen okutmalar bir daha sayaca düşmez — magnetin iki faydasını da
  // ortadan kaldırır.
  const response = NextResponse.redirect(url, 302);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

async function recordScan(tenantId: string | null, slug: string, request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return;
    await supabase.from("magnet_scans").insert({
      tenant_id: tenantId,
      slug,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      referer: request.headers.get("referer")?.slice(0, 300) ?? null,
    });
  } catch {
    // Ölçüm kaydı, yönlendirmeyi hiçbir koşulda engellememeli.
  }
}

/**
 * Kod havuzunda arama. Kod bulunursa (atanmış ya da atanmamış) döner,
 * bulunmazsa null — çağıran taraf o zaman slug'ı subdomain kabul eder.
 *
 * lower() ile arıyoruz: magnetteki metni elle yazan müşteri K7M2XQ da
 * yazabilir, benzersiz indeks de lower(code) üzerinde.
 */
async function lookupMagnetCode(code: string): Promise<{ tenantId: string | null } | null> {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("magnet_codes")
      .select("tenant_id")
      .ilike("code", code)
      .maybeSingle();

    return data ? { tenantId: data.tenant_id ?? null } : null;
  } catch {
    // Havuz okunamazsa eski davranışa düş: slug'ı subdomain say.
    return null;
  }
}

/** Koda atanmış tenant'ı id üzerinden getirir. */
async function getStorefrontTenantById(tenantId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("tenants")
      .select("id, subdomain, custom_domain, status")
      .eq("id", tenantId)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
}
