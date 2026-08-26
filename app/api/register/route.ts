import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getClientIp } from '@/lib/storefront/client-ip'
import {
  formatPlanCapacityDescription,
  getPlanLabel,
  PLAN_PRICING,
  type TenantPlan,
} from '@/lib/billing/plans'
import { TERMS_VERSION, TERMS_VERSION_LABEL } from '@/lib/legal/terms'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

type BillingPeriod = 'yearly' | 'monthly'

function getPlanLabelWithDetails(plan: TenantPlan, billingPeriod: BillingPeriod) {
  const pricing = PLAN_PRICING[plan]
  const priceLabel =
    billingPeriod === 'monthly' && pricing.monthlyPrice
      ? `${pricing.monthlyPrice} ${pricing.monthlyUnit}`
      : `${pricing.price} ${pricing.unit}`
  return `${getPlanLabel(plan)} — ${priceLabel} • ${formatPlanCapacityDescription(plan)}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, company, email, phone, plan, billingPeriod, termsAccepted } = body
    const normalizedBillingPeriod: BillingPeriod = billingPeriod === 'monthly' ? 'monthly' : 'yearly'

    if (!fullName?.trim() || !company?.trim() || !email?.trim() || !plan?.trim()) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 })
    }

    // Onay sunucuda da doğrulanıyor: istemci kontrolü atlanabilir, kabul
    // kaydı ise hukuki delil — doğrulanmadan yazılmamalı.
    if (termsAccepted !== true) {
      return NextResponse.json(
        { error: 'Kullanım Şartları kabul edilmeden kayıt yapılamaz.' },
        { status: 400 },
      )
    }

    // Kabul kaydı e-posta gönderiminden ÖNCE yazılıyor ki SMTP hatası
    // yüzünden kabul kanıtı kaybolmasın. Yazma başarısız olursa akış yine
    // de sürüyor — başvuruyu bir veritabanı hatası yüzünden düşürmek,
    // eksik delilden daha kötü.
    try {
      const supabase = createSupabaseAdminClient()
      if (supabase) {
        await supabase.from('terms_acceptances').insert({
          email: String(email).trim(),
          full_name: String(fullName).trim(),
          company: String(company).trim(),
          terms_version: TERMS_VERSION,
          accepted_at: new Date().toISOString(),
          // Cloudflare arkasında gerçek IP cf-connecting-ip'te; yardımcı
          // önce onu okur (bkz. lib/storefront/client-ip.ts).
          ip_address: getClientIp(req),
          user_agent: req.headers.get('user-agent') ?? null,
          source: 'kayit_formu',
        })
      }
    } catch (dbErr) {
      console.error('[register] kabul kaydı yazılamadı:', dbErr)
    }

    const planLabel =
      plan in PLAN_PRICING
        ? getPlanLabelWithDetails(plan as TenantPlan, normalizedBillingPeriod)
        : String(plan)
    const billingPeriodLabel = normalizedBillingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"Ekatalox Kayıt Formu" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECIPIENT ?? process.env.SMTP_USER,
      replyTo: `"${fullName}" <${email}>`,
      subject: `[Yeni Kayıt] ${fullName} — ${company} (${planLabel})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="color:#1a1a2e;margin-bottom:20px;">Yeni Kayıt Talebi</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#555;width:130px;font-weight:bold;border-bottom:1px solid #eee;">Ad Soyad</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${fullName}</td></tr>
            <tr><td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">Şirket</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${company}</td></tr>
            <tr><td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">E-posta</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${email}</td></tr>
            ${phone ? `<tr><td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">Telefon</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${phone}</td></tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">Ödeme Dönemi</td>
              <td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${billingPeriodLabel}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">Şartlar Onayı</td>
              <td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">Kabul edildi — sürüm ${TERMS_VERSION_LABEL}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#555;font-weight:bold;">Seçilen Plan</td>
              <td style="padding:10px 0;">
                <span style="display:inline-block;padding:4px 12px;background:#1a1a2e;color:#00D2FF;border-radius:20px;font-size:13px;font-weight:600;">
                  ${planLabel}
                </span>
              </td>
            </tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[register] mail error:', err)
    return NextResponse.json({ error: 'Mail gönderilemedi' }, { status: 500 })
  }
}
