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

  const tenant = normalized ? await getStorefrontTenantCached(normalized) : null;

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

async function recordScan(tenantId: string, slug: string, request: Request) {
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
