import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const subjectLabels: Record<string, string> = {
  demo: 'Demo Talep Etmek İstiyorum',
  satis: 'Satış / Fiyat Teklifi',
  destek: 'Teknik Destek',
  ortaklik: 'Ortaklık / Anlaşma',
  diger: 'Diğer',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, company, email, phone, subject, message } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
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
      from: `"Ekatalox İletişim Formu" <${process.env.SMTP_USER}>`,
      to: 'info@ekatalox.com',
      replyTo: email,
      subject: `[İletişim] ${subjectLabels[subject] ?? subject} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="color:#1a1a2e;margin-bottom:20px;">Yeni İletişim Formu Mesajı</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#555;width:120px;font-weight:bold;">Ad Soyad</td><td style="padding:8px 0;color:#222;">${name}</td></tr>
            ${company ? `<tr><td style="padding:8px 0;color:#555;font-weight:bold;">Şirket</td><td style="padding:8px 0;color:#222;">${company}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#555;font-weight:bold;">E-posta</td><td style="padding:8px 0;color:#222;">${email}</td></tr>
            ${phone ? `<tr><td style="padding:8px 0;color:#555;font-weight:bold;">Telefon</td><td style="padding:8px 0;color:#222;">${phone}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Konu</td><td style="padding:8px 0;color:#222;">${subjectLabels[subject] ?? subject}</td></tr>
          </table>
          <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />
          <p style="color:#555;font-weight:bold;margin-bottom:8px;">Mesaj:</p>
          <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #e0e0e0;color:#222;white-space:pre-wrap;">${message}</div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] mail error:', err)
    return NextResponse.json({ error: 'Mail gönderilemedi' }, { status: 500 })
  }
}
