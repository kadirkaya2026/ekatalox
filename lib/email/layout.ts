// Markalı e-posta kabuğu: lacivert (#12284A) başlık şeridi, "eKatalox"
// yazı markası, 600px genişlik, okunur gövde, telefon + destek adresli alt
// bilgi. Tüm şablonlar buradan geçer; her e-postanın text/plain sürümü de
// aynı yardımcıyla üretilir (spam skoru ve eski istemciler için).
import { SITE } from "@/lib/marketing/site";

const NAVY = "#12284A";
const GREEN = "#157A5B";
const INK = "#1B2432";
const MUTED = "#5C6B7A";
const LINE = "#D9E0E8";
const PAPER = "#F5F7FA";

const FONT_STACK =
  "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${text}</p>`;
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:${NAVY};">${escapeHtml(text)}</h1>`;
}

export function subheading(text: string) {
  return `<h2 style="margin:24px 0 12px;font-size:16px;line-height:1.4;font-weight:700;color:${NAVY};">${escapeHtml(text)}</h2>`;
}

export function button(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;"><tr><td style="border-radius:6px;background:${GREEN};"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;font-family:${FONT_STACK};">${escapeHtml(label)}</a></td></tr></table>`;
}

export function linkRow(label: string, href: string) {
  return `<tr><td style="padding:8px 0;font-size:14px;color:${MUTED};width:150px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:14px;color:${INK};"><a href="${escapeHtml(href)}" style="color:${GREEN};text-decoration:underline;">${escapeHtml(href)}</a></td></tr>`;
}

export function dataRow(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return `<tr><td style="padding:8px 0;font-size:14px;color:${MUTED};width:150px;vertical-align:top;border-bottom:1px solid ${LINE};">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:14px;color:${INK};border-bottom:1px solid ${LINE};">${escapeHtml(value)}</td></tr>`;
}

export function dataTable(rows: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;border-collapse:collapse;">${rows}</table>`;
}

export function bulletList(items: string[]) {
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:15px;line-height:1.55;color:${INK};">${item}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 20px;padding-left:20px;">${lis}</ul>`;
}

export function noteBox(text: string) {
  return `<div style="margin:0 0 20px;padding:14px 16px;border-left:4px solid ${GREEN};background:${PAPER};font-size:14px;line-height:1.55;color:${INK};">${text}</div>`;
}

export function renderEmailLayout(params: { title: string; bodyHtml: string; preheader?: string }) {
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(params.preheader)}</div>`
    : "";

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${FONT_STACK};">
${preheader}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${PAPER};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#FFFFFF;border:1px solid ${LINE};border-radius:8px;overflow:hidden;">
<tr><td style="background:${NAVY};padding:18px 28px;">
<span style="font-family:${FONT_STACK};font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#FFFFFF;">eKatalox</span>
</td></tr>
<tr><td style="padding:28px 28px 8px;font-family:${FONT_STACK};">
${params.bodyHtml}
</td></tr>
<tr><td style="padding:20px 28px 28px;border-top:1px solid ${LINE};font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
Sorunuz olursa bize yazın: <a href="mailto:${SITE.supportEmail}" style="color:${GREEN};text-decoration:underline;">${SITE.supportEmail}</a><br>
Telefon / WhatsApp: <a href="${SITE.phoneHref}" style="color:${GREEN};text-decoration:none;">${SITE.phone}</a><br>
<a href="${SITE.url}" style="color:${MUTED};text-decoration:underline;">${SITE.domain}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** text/plain alternatifi: satırlar dizisi + ortak alt bilgi. */
export function renderEmailText(lines: string[]) {
  return [
    ...lines,
    "",
    "—",
    `eKatalox · ${SITE.domain}`,
    `Destek: ${SITE.supportEmail} · Telefon / WhatsApp: ${SITE.phone}`,
  ].join("\n");
}

export function formatDateTr(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
