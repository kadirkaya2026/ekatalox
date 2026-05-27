import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const planLabels: Record<string, string> = {
  baslangic:   'Başlangıç — ₺20.000 / Yıl',
  profesyonel: 'Profesyonel — ₺45.000 / Yıl ⭐ Popüler',
  kurumsal:    'Kurumsal — ₺95.000 / Yıl',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, company, email, phone, plan } = body

    if (!fullName?.trim() || !company?.trim() || !email?.trim() || !plan?.trim()) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 })
    }

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
      subject: `[Yeni Kayıt] ${fullName} — ${company} (${planLabels[plan] ?? plan})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="color:#1a1a2e;margin-bottom:20px;">Yeni Kayıt Talebi</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#555;width:130px;font-weight:bold;border-bottom:1px solid #eee;">Ad Soyad</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${fullName}</td></tr>
            <tr><td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">Şirket</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${company}</td></tr>
            <tr><td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">E-posta</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${email}</td></tr>
            ${phone ? `<tr><td style="padding:10px 0;color:#555;font-weight:bold;border-bottom:1px solid #eee;">Telefon</td><td style="padding:10px 0;color:#222;border-bottom:1px solid #eee;">${phone}</td></tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#555;font-weight:bold;">Seçilen Plan</td>
              <td style="padding:10px 0;">
                <span style="display:inline-block;padding:4px 12px;background:#1a1a2e;color:#00D2FF;border-radius:20px;font-size:13px;font-weight:600;">
                  ${planLabels[plan] ?? plan}
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
