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

/** Tüm e-postaların gönderen adresi (kullanıcı kararı 17 Eki 2026). */
export const DEFAULT_SENDER_ADDRESS = "bildirim@ekatalox.com";

export function getSenderAddress() {
  // Resend SMTP'de (smtp.resend.com, kullanıcı "resend") gönderen her zaman
  // bildirim@ekatalox.com; Gmail SMTP'de Gmail gönderen adresi hesabın adresiyle
  // değiştirdiği için eski davranış (SMTP kullanıcısı) korunur.
  if (process.env.EMAIL_FROM?.trim()) return process.env.EMAIL_FROM.trim();
  const smtpUser = process.env.SMTP_USER ?? "";
  return smtpUser.includes("@") ? smtpUser : DEFAULT_SENDER_ADDRESS;
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
  // SMTP kullanıcısı e-posta değilse (Resend: "resend") info@ adresine düşer.
  const smtpUser = process.env.SMTP_USER ?? "";
  return process.env.CONTACT_RECIPIENT ?? (smtpUser.includes("@") ? smtpUser : "info@ekatalox.com");
}
