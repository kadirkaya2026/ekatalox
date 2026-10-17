import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isRateLimited } from "@/lib/api/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { button, escapeHtml, noteBox, paragraph, renderEmailLayout, renderEmailText } from "@/lib/email/layout";
import { getTenantStorefrontOrigin } from "@/lib/push/send-tenant-broadcast-push";
import { getClientIp } from "@/lib/storefront/client-ip";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import {
  claimGuestOrders,
  clearMemberCookie,
  findMemberByEmail,
  findMemberByPhone,
  hashMemberPassword,
  hashResetToken,
  memberPasswordSchema,
  memberProfileSchema,
  publicMember,
  readMemberForTenant,
  resolveTenantForMembership,
  sanitizeTrackingTokens,
  setMemberCookie,
  verifyMemberPassword,
} from "@/lib/storefront/member";
import { isSecureStorefrontRequest } from "@/lib/storefront/session";

// Vitrin üyeliği (market/tekel, 0180). GET = oturumdaki üye; POST = giriş /
// kayıt / çıkış / şifremi unuttum / şifre sıfırlama; PATCH = bilgiler + şifre.
// Siparişler /api/storefront/my-orders'tan gelir (üye çerezi orada da okunur).

const RESET_TTL_MINUTES = 60;
const NO_STORE = { "Cache-Control": "no-store" };
const MEMBER_SELECT = "id, tenant_id, phone, full_name, address, email, email_notifications, password_hash";

const phoneSchema = z
  .string()
  .trim()
  .max(40)
  .transform((v) => normalizeCustomerPhone(v))
  .refine((v) => v.length >= 10, "Geçerli bir telefon numarası yazın.");

const subdomainSchema = z.string().trim().min(1).max(63);

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("login"),
    subdomain: subdomainSchema,
    phone: phoneSchema,
    password: z.string().min(1, "Şifrenizi yazın.").max(72),
    guest_tokens: z.array(z.string()).max(50).optional(),
  }),
  z.object({
    action: z.literal("register"),
    subdomain: subdomainSchema,
    phone: phoneSchema,
    password: memberPasswordSchema,
    full_name: z.string(),
    address: z.string().optional(),
    email: z.string().nullish(),
    guest_tokens: z.array(z.string()).max(50).optional(),
  }),
  z.object({ action: z.literal("logout"), subdomain: subdomainSchema }),
  z.object({ action: z.literal("forgot"), subdomain: subdomainSchema, identifier: z.string().trim().min(3).max(200) }),
  z.object({
    action: z.literal("reset"),
    subdomain: subdomainSchema,
    token: z.string().trim().min(20).max(100),
    password: memberPasswordSchema,
  }),
]);

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Geçersiz istek.";
}

export async function GET(request: Request) {
  const subdomain = new URL(request.url).searchParams.get("subdomain");
  const base = await resolveTenantForMembership(subdomain);
  if (!base) return NextResponse.json({ enabled: false, member: null }, { headers: NO_STORE });
  const member = await readMemberForTenant(base.supabase, base.tenant.id);
  return NextResponse.json({ enabled: true, member }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  const body = parsed.data;
  const secure = isSecureStorefrontRequest(request);

  if (body.action === "logout") {
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    clearMemberCookie(response, secure);
    return response;
  }

  const base = await resolveTenantForMembership(body.subdomain);
  if (!base) return NextResponse.json({ error: "Bu mağazada üyelik yok." }, { status: 404 });
  const { supabase, tenant } = base;
  const ip = getClientIp(request) ?? "unknown";

  if (body.action === "login") {
    // Şifre deneme freni: IP başına ve numara başına ayrı.
    if (
      isRateLimited(`member-login:${ip}:${tenant.id}`, 15, 10 * 60_000) ||
      isRateLimited(`member-login-phone:${tenant.id}:${body.phone}`, 8, 15 * 60_000)
    ) {
      return NextResponse.json({ error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin." }, { status: 429 });
    }
    const row = await findMemberByPhone(supabase, tenant.id, body.phone);
    if (!row || !verifyMemberPassword(body.password, row.password_hash)) {
      return NextResponse.json({ error: "Telefon numarası veya şifre hatalı." }, { status: 401 });
    }
    await claimGuestOrders(supabase, tenant.id, row.id, sanitizeTrackingTokens(body.guest_tokens));
    await supabase.from("store_members").update({ last_login_at: new Date().toISOString() }).eq("id", row.id);
    const response = NextResponse.json({ member: publicMember(row) }, { headers: NO_STORE });
    setMemberCookie(response, row, secure);
    return response;
  }

  if (body.action === "register") {
    if (isRateLimited(`member-register:${ip}:${tenant.id}`, 6, 30 * 60_000)) {
      return NextResponse.json({ error: "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin." }, { status: 429 });
    }
    const profile = memberProfileSchema.safeParse({ full_name: body.full_name, address: body.address ?? "", email: body.email });
    if (!profile.success) return NextResponse.json({ error: firstIssue(profile.error) }, { status: 400 });

    if (await findMemberByPhone(supabase, tenant.id, body.phone)) {
      return NextResponse.json(
        { error: "Bu numarayla zaten üyelik var. Giriş yapın ya da şifrenizi yenileyin.", code: "phone_taken" },
        { status: 409 },
      );
    }
    if (profile.data.email && (await findMemberByEmail(supabase, tenant.id, profile.data.email))) {
      return NextResponse.json({ error: "Bu e-posta başka bir üyelikte kayıtlı." }, { status: 409 });
    }

    const { data: row, error } = await supabase
      .from("store_members")
      .insert({
        tenant_id: tenant.id,
        phone: body.phone,
        password_hash: hashMemberPassword(body.password),
        full_name: profile.data.full_name,
        address: profile.data.address,
        email: profile.data.email,
        last_login_at: new Date().toISOString(),
      })
      .select(MEMBER_SELECT)
      .single();
    if (error || !row) {
      if (error?.code === "23505") {
        return NextResponse.json({ error: "Bu numara ya da e-posta zaten kayıtlı.", code: "phone_taken" }, { status: 409 });
      }
      console.error("[member] kayıt hatası:", error);
      return NextResponse.json({ error: "Üyelik oluşturulamadı, tekrar deneyin." }, { status: 500 });
    }
    // Kayıtta yazılan adres ana adres ("Ev") olur (0181).
    if (profile.data.address) {
      await supabase
        .from("store_member_addresses")
        .insert({ member_id: row.id, tenant_id: tenant.id, title: "Ev", address: profile.data.address, is_default: true });
    }
    // Eski siparişler yalnız bu cihazın takip kodlarıyla bağlanır; numara
    // aynı diye başkasının siparişi hesaba gelmez.
    await claimGuestOrders(supabase, tenant.id, row.id, sanitizeTrackingTokens(body.guest_tokens));
    const response = NextResponse.json({ member: publicMember(row) }, { headers: NO_STORE });
    setMemberCookie(response, row, secure);
    return response;
  }

  if (body.action === "forgot") {
    // Yanıt her durumda aynı: hangi numaranın/e-postanın üye olduğu sızmasın.
    const generic = NextResponse.json(
      {
        ok: true,
        message:
          "Üyeliğinizde e-posta kayıtlıysa şifre yenileme bağlantısı gönderildi. E-posta eklemediyseniz şifrenizi yenilemesi için mağazayı arayın.",
      },
      { headers: NO_STORE },
    );
    if (isRateLimited(`member-forgot:${ip}:${tenant.id}`, 5, 30 * 60_000)) return generic;

    const id = body.identifier;
    const row = id.includes("@")
      ? await findMemberByEmail(supabase, tenant.id, id)
      : normalizeCustomerPhone(id).length >= 10
        ? await findMemberByPhone(supabase, tenant.id, id)
        : null;
    if (!row?.email) return generic;

    const token = randomBytes(32).toString("base64url");
    const { error } = await supabase.from("store_member_password_resets").insert({
      member_id: row.id,
      token_hash: hashResetToken(token),
      expires_at: new Date(Date.now() + RESET_TTL_MINUTES * 60_000).toISOString(),
    });
    if (error) {
      console.error("[member] sıfırlama kaydı:", error);
      return generic;
    }
    const storeName = tenant.company_name;
    const resetUrl = `${getTenantStorefrontOrigin(tenant)}/giris?sifirla=${encodeURIComponent(token)}`;
    const greeting = row.full_name ? `Merhaba ${row.full_name},` : "Merhaba,";
    await sendEmail({
      to: row.email,
      fromName: storeName,
      subject: `${storeName} — şifre yenileme`,
      html: renderEmailLayout({
        title: "Şifrenizi yenileyin",
        preheader: `Yeni şifre bağlantınız ${RESET_TTL_MINUTES} dakika geçerli.`,
        hero: { eyebrow: storeName, title: "Şifrenizi yenileyin", subtitle: "Tek tıkla yeni şifrenizi belirleyin." },
        bodyHtml: [
          paragraph(escapeHtml(greeting)),
          paragraph(`${escapeHtml(storeName)} üyeliğiniz için şifre yenileme isteği aldık.`),
          button(resetUrl, "Yeni şifre belirle"),
          noteBox(
            `Bağlantı <strong>${RESET_TTL_MINUTES} dakika</strong> geçerlidir ve bir kez kullanılabilir. Bu isteği siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.`,
          ),
        ].join(""),
      }),
      text: renderEmailText([
        greeting,
        "",
        `${storeName} üyeliğiniz için şifre yenileme bağlantısı (${RESET_TTL_MINUTES} dakika geçerli):`,
        resetUrl,
        "",
        "Bu isteği siz yapmadıysanız bu e-postayı yok sayın.",
      ]),
    });
    return generic;
  }

  // reset
  const { data: reset } = await supabase
    .from("store_member_password_resets")
    .select("id, member_id, expires_at, used_at")
    .eq("token_hash", hashResetToken(body.token))
    .maybeSingle();
  if (!reset || reset.used_at || new Date(reset.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Bağlantının süresi dolmuş ya da kullanılmış. Yeniden isteyin." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const { data: row } = await supabase
    .from("store_members")
    .update({ password_hash: hashMemberPassword(body.password), updated_at: now, last_login_at: now })
    .eq("id", reset.member_id)
    .eq("tenant_id", tenant.id)
    .select(MEMBER_SELECT)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Bağlantı bu mağazaya ait değil." }, { status: 400 });
  await supabase.from("store_member_password_resets").update({ used_at: now }).eq("member_id", row.id).is("used_at", null);
  const response = NextResponse.json({ member: publicMember(row) }, { headers: NO_STORE });
  setMemberCookie(response, row, secure);
  return response;
}

const patchSchema = z.object({
  subdomain: subdomainSchema,
  full_name: z.string(),
  address: z.string().optional(),
  email: z.string().nullish(),
  email_notifications: z.boolean().optional(),
  current_password: z.string().max(72).optional(),
  new_password: memberPasswordSchema.optional(),
});

export async function PATCH(request: Request) {
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  const body = parsed.data;
  const base = await resolveTenantForMembership(body.subdomain);
  if (!base) return NextResponse.json({ error: "Bu mağazada üyelik yok." }, { status: 404 });
  const { supabase, tenant } = base;
  const member = await readMemberForTenant(supabase, tenant.id);
  if (!member) return NextResponse.json({ error: "Oturumunuz kapanmış, tekrar giriş yapın." }, { status: 401 });

  const profile = memberProfileSchema.safeParse({
    full_name: body.full_name,
    address: body.address ?? "",
    email: body.email,
    email_notifications: body.email_notifications,
  });
  if (!profile.success) return NextResponse.json({ error: firstIssue(profile.error) }, { status: 400 });
  if (profile.data.email_notifications && !profile.data.email) {
    return NextResponse.json({ error: "E-posta bildirimi için e-posta adresinizi yazın." }, { status: 400 });
  }
  if (profile.data.email && profile.data.email !== member.email) {
    const other = await findMemberByEmail(supabase, tenant.id, profile.data.email);
    if (other && other.id !== member.id) return NextResponse.json({ error: "Bu e-posta başka bir üyelikte kayıtlı." }, { status: 409 });
  }

  const update: Record<string, unknown> = { ...profile.data, updated_at: new Date().toISOString() };
  if (profile.data.email_notifications === undefined) delete update.email_notifications;
  // E-posta silinirse e-posta bildirimi de kapanır.
  if (!profile.data.email) update.email_notifications = false;
  if (body.new_password) {
    const current = await findMemberByPhone(supabase, tenant.id, member.phone);
    if (!current || !verifyMemberPassword(body.current_password ?? "", current.password_hash)) {
      return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
    }
    update.password_hash = hashMemberPassword(body.new_password);
  }

  const { data: row, error } = await supabase.from("store_members").update(update).eq("id", member.id).select(MEMBER_SELECT).single();
  if (error || !row) return NextResponse.json({ error: "Kaydedilemedi, tekrar deneyin." }, { status: 500 });
  const response = NextResponse.json({ member: publicMember(row) }, { headers: NO_STORE });
  // Şifre değiştiyse çerez yeni izle yenilenir (diğer cihazlar çıkış yapar).
  if (body.new_password) setMemberCookie(response, row, isSecureStorefrontRequest(request));
  return response;
}
