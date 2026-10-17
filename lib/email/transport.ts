// Tek nodemailer taşıyıcısı. Env: SMTP_HOST / SMTP_PORT / SMTP_SECURE /
// SMTP_USER / SMTP_PASS (app/api/contact ve /api/register ile aynı değişkenler).
// Gönderen adresi EMAIL_FROM (yoksa SMTP_USER); mağaza adına gidenler
// STORE_EMAIL_FROM; satış bildirimlerinin alıcısı CONTACT_RECIPIENT.
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let cached: Transporter | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getEmailTransport(): Transporter | null {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!cached) {
    cached = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return cached;
}

export function getSenderAddress() {
  // Resend SMTP'de kullanıcı adı "resend" olduğu için gönderen ayrı ayarlanır
  // (ör. info@ekatalox.com); yoksa eski davranış: SMTP kullanıcısı (Gmail).
  return process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER || "";
}

/**
 * Mağaza adına giden müşteri e-postalarının gönderen adresi (ör.
 * bildirim@ekatalox.com). SMTP Gmail iken Gmail bunu hesabın adresiyle
 * değiştirir; doğrulanmış alan adıyla (Resend SMTP) çalışır. Ayar yoksa
 * platform adresi kullanılır.
 */
export function getStoreSenderAddress() {
  return process.env.STORE_EMAIL_FROM?.trim() || getSenderAddress();
}

/** Satış/kayıt bildirimlerinin gittiği adres. */
export function getSalesRecipient() {
  return process.env.CONTACT_RECIPIENT ?? process.env.SMTP_USER ?? "";
}
