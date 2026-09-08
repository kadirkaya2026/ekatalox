import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { findAuthUserByEmail, issueResetToken } from "@/lib/auth/password-reset";
import { sendEmail } from "@/lib/email/send";
import { buildPasswordResetEmail } from "@/lib/email/templates/password-reset";
import { SITE } from "@/lib/marketing/site";
import { getClientIp } from "@/lib/storefront/client-ip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Her durumda 200: e-postanın kayıtlı olup olmadığı dışarıya sızmaz.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (ip && isRateLimited(`reset:${ip}`, 10, 60 * 60_000)) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: true });

  const user = await findAuthUserByEmail(supabase, email);
  if (!user) return NextResponse.json({ ok: true });

  const token = await issueResetToken(supabase, user.id);
  if (!token) return NextResponse.json({ ok: true });

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const mail = buildPasswordResetEmail({ resetUrl: `${SITE.url}/sifre-yenile?token=${token}`, fullName });
  void sendEmail({ to: email, ...mail });

  return NextResponse.json({ ok: true });
}
