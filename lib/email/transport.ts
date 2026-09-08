// Tek nodemailer taşıyıcısı. Env: SMTP_HOST / SMTP_PORT / SMTP_SECURE /
// SMTP_USER / SMTP_PASS (app/api/contact ve /api/register ile aynı değişkenler).
// Gönderen adresi SMTP_USER; satış bildirimlerinin alıcısı CONTACT_RECIPIENT.
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
  return process.env.SMTP_USER ?? "";
}

/** Satış/kayıt bildirimlerinin gittiği adres. */
export function getSalesRecipient() {
  return process.env.CONTACT_RECIPIENT ?? process.env.SMTP_USER ?? "";
}
