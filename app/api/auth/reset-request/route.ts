import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { findAuthUserByEmail, issueResetToken } from "@/lib/auth/password-reset";
import { sendEmail } from "@/lib/email/send";
import { buildPasswordResetEmail } from "@/lib/email/templates/password-reset";
import { SITE } from "@/lib/marketing/site";
import { getClientIp } from "@/lib/storefront/client-ip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// 30 Eyl 2026 (kullanıcı kararı): kayıtlı olmayan e-postada açık uyarı verilir
// (registered:false). Kötüye kullanımı IP başına saatte 10 deneme sınırı frenler.
// E-posta beklenerek gönderilir; sunucusuz ortamda yanıt dönünce yarım kalmasın.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (ip && isRateLimited(`reset:${ip}`, 10, 60 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Çok fazla deneme yaptınız. Lütfen bir saat sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Şu anda işlem yapılamıyor, lütfen tekrar deneyin." }, { status: 503 });

  const user = await findAuthUserByEmail(supabase, email);
  if (!user) {
    return NextResponse.json({ ok: false, registered: false, error: "Bu e-posta adresi sistemimizde kayıtlı değil." }, { status: 404 });
  }

  const token = await issueResetToken(supabase, user.id);
  if (!token) return NextResponse.json({ ok: false, error: "Bağlantı oluşturulamadı, lütfen tekrar deneyin." }, { status: 500 });

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const mail = buildPasswordResetEmail({ resetUrl: `${SITE.url}/sifre-yenile?token=${token}`, fullName });
  const sent = await sendEmail({ to: email, ...mail });
  if (!sent) {
    return NextResponse.json({ ok: false, error: "E-posta gönderilemedi, lütfen biraz sonra tekrar deneyin." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
