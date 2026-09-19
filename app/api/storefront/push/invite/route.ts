import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStorefrontTenant } from "@/lib/data";
import { isSecureStorefrontRequest, readStorefrontPriceList, setStorefrontPriceListCookie } from "@/lib/storefront/session";
import { INVITE_TOKEN_RE } from "@/lib/push/invite";

// /bildirim "tek link" akışının davet kaydı (bkz. supabase/migrations/0124_push_invites.sql).
// POST: Safari'de girilen ad + telefon → token. Şifre kapısından geçmiş olmak
//       şart (çerez), böylece davet doğru erişim koduna/fiyat listesine bağlanır.
// GET : token → ad/telefon. Ana ekran uygulamasında çerez yoksa daveti
//       oluşturan oturumun fiyat listesiyle çerez de yazılır; token bunun
//       için yeterli yetkidir (şifreyi bilen biri üretmiştir).
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

async function resolveTenant(subdomainRaw: unknown) {
  const subdomain = String(subdomainRaw ?? "").trim().toLowerCase();
  if (!subdomain) return null;
  const tenant = await getStorefrontTenant(subdomain);
  return tenant ? { subdomain, tenant } : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = await resolveTenant(body?.subdomain);
  if (!ctx) return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  if (name.length < 2 || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "Ad ve telefon zorunlu." }, { status: 400 });
  }
  const cookie = await readStorefrontPriceList(ctx.subdomain);
  const sameTenant = cookie && cookie.tenantId === ctx.tenant.id;
  if (ctx.tenant.is_password_protected && !sameTenant) {
    return NextResponse.json({ error: "Önce mağazaya giriş yapın." }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const token = randomBytes(18).toString("base64url");
  const { error } = await supabase.from("push_invites").insert({
    token,
    tenant_id: ctx.tenant.id,
    access_code_id: sameTenant ? cookie.accessCodeId ?? null : null,
    price_list_id: sameTenant && cookie.priceListId ? cookie.priceListId : null,
    subscriber_name: name,
    subscriber_phone: phone,
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
  });
  if (error) return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  return NextResponse.json({ ok: true, token }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const ctx = await resolveTenant(url.searchParams.get("subdomain"));
  const supabase = createSupabaseAdminClient();
  if (!ctx || !INVITE_TOKEN_RE.test(token) || !supabase) {
    return NextResponse.json({ error: "Geçersiz." }, { status: 400 });
  }
  const { data } = await supabase
    .from("push_invites")
    .select("subscriber_name, subscriber_phone, access_code_id, price_list_id, created_at, subscribed_at")
    .eq("tenant_id", ctx.tenant.id)
    .eq("token", token)
    .maybeSingle();
  if (!data || Date.now() - new Date(data.created_at).getTime() > INVITE_TTL_MS) {
    return NextResponse.json({ error: "Davet bulunamadı ya da süresi dolmuş." }, { status: 404 });
  }
  const response = NextResponse.json(
    { name: data.subscriber_name, phone: data.subscriber_phone, subscribed: Boolean(data.subscribed_at) },
    { headers: { "Cache-Control": "no-store" } },
  );
  const cookie = await readStorefrontPriceList(ctx.subdomain);
  if ((!cookie || cookie.tenantId !== ctx.tenant.id) && data.price_list_id) {
    const { data: priceList } = await supabase
      .from("price_lists")
      .select("is_catalog_only")
      .eq("id", data.price_list_id)
      .maybeSingle();
    setStorefrontPriceListCookie({
      response,
      tenantId: ctx.tenant.id,
      subdomain: ctx.subdomain,
      priceListId: data.price_list_id,
      isCatalogOnly: Boolean(priceList?.is_catalog_only),
      accessCodeId: data.access_code_id ?? undefined,
      secure: isSecureStorefrontRequest(request),
    });
  }
  return response;
}
