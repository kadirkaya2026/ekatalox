import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { isTrialExpired } from "@/lib/billing/trial";
import { getStorefrontTenant } from "@/lib/data";
import { dealerApplicationInputSchema } from "@/lib/kurumsal/applications";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { parseKurumsalContent } from "@/lib/kurumsal/schema";
import { getClientIp } from "@/lib/storefront/client-ip";
import { getKurumsalSiteRow } from "@/lib/storefront/kurumsal-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Kurumsal sayfadaki (/kurumsal#basvuru) bayi başvuru formu. Herkese açık
// uç: şifre kapısı yok, bu yüzden IP başına saatte 5 başvuru frenlenir ve
// "website" bot tuzağı doluysa kayıt yapılmadan başarı döner (bot farkı
// anlamasın). Başvuru yalnız yayındaki kurumsal sitesi olan, aktif ve
// denemesi bitmemiş tenant'a kaydedilir.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = dealerApplicationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Form bilgileri hatalı." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (input.website?.trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const ip = getClientIp(request);
  if (ip && isRateLimited(`kurumsal-basvuru:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json(
      { error: "Çok fazla başvuru gönderildi. Lütfen bir süre sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const subdomain = input.subdomain.toLowerCase();
  const tenant = await getStorefrontTenant(subdomain);
  if (
    !tenant ||
    tenant.status !== "active" ||
    isTrialExpired(tenant) ||
    // Kurumsal site yalnız üst pakette var.
    !hasKurumsalSiteAccess(tenant)
  ) {
    return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
  }

  const site = await getKurumsalSiteRow(tenant.id);
  const content = site ? parseKurumsalContent(site.content) : null;
  if (!site?.is_published || !content?.sections.form) {
    return NextResponse.json({ error: "Başvuru formu şu an kapalı." }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { error } = await supabase.from("dealer_applications").insert({
    tenant_id: tenant.id,
    company_name: input.company_name,
    contact_name: input.contact_name,
    phone: input.phone,
    city: input.city ?? null,
    note: input.note ?? null,
    source: "kurumsal",
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
  });

  if (error) {
    console.error("[kurumsal] başvuru kaydedilemedi:", error.message);
    return NextResponse.json({ error: "Başvuru kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
