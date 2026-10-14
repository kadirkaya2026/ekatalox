// Markalı e-posta kabuğu (14 Eki 2026 yenilendi): koyu gradyanlı üst alan +
// beyaz/yeşil eKatalox logosu, isteğe bağlı büyük başlık (hero), 600px kart,
// hap düğme, numaralı adım kartları, koyu alt bilgi şeridi. Tüm şablonlar
// buradan geçer; her e-postanın text/plain sürümü de aynı yardımcıyla üretilir.
//
// E-posta istemcisi kuralları: yalnız tablo + satır içi stil; gradyan
// destekleyen istemciler (Apple Mail, Gmail web/mobil) gradyanı, diğerleri
// bgcolor düz rengini görür. Logo dışarıdan (www.ekatalox.com) yüklenir;
// görseller kapalıysa alt metin "eKatalox" beyaz yazı olarak kalır.
import { SITE } from "@/lib/marketing/site";

const DARK = "#0B1220";
const DARK_2 = "#0E2A35";
const GREEN = "#0E9F6E";
const GREEN_DARK = "#047857";
const NEON = "#10F59A";
const INK = "#162033";
const MUTED = "#5C6B7A";
const LINE = "#E3E8EF";
const PAPER = "#EEF2F6";
const SOFT = "#F6F8FB";
const MINT = "#ECFDF5";

const LOGO_URL = `${SITE.url}/ekatalox-logo-v2.png`;

const FONT_STACK = "'Poppins', 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${INK};">${text}</p>`;
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${DARK};">${escapeHtml(text)}</h1>`;
}

export function subheading(text: string) {
  return `<h2 style="margin:28px 0 14px;font-size:13px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${GREEN_DARK};">${escapeHtml(text)}</h2>`;
}

export function button(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:10px 0 26px;"><tr><td bgcolor="${GREEN}" style="border-radius:999px;background:${GREEN};background-image:linear-gradient(135deg,#12B981 0%,${GREEN_DARK} 100%);box-shadow:0 8px 20px rgba(4,120,87,0.28);"><a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;letter-spacing:0.01em;color:#FFFFFF;text-decoration:none;font-family:${FONT_STACK};border-radius:999px;">${escapeHtml(label)} &nbsp;&rarr;</a></td></tr></table>`;
}

// Uzun adres/e-postayı harf ortasından değil nokta, @ ve / sonrasından böl.
function softBreak(text: string) {
  return escapeHtml(text).replace(/([./@])/g, "$1<wbr>");
}

function infoRow(label: string, valueHtml: string) {
  return `<tr><td style="padding:12px 18px;border-bottom:1px solid ${LINE};"><div style="font-size:12px;line-height:1.4;color:${MUTED};">${escapeHtml(label)}</div><div style="margin-top:3px;font-size:15px;line-height:1.45;font-weight:600;color:${INK};overflow-wrap:anywhere;">${valueHtml}</div></td></tr>`;
}

export function linkRow(label: string, href: string) {
  return infoRow(label, `<a href="${escapeHtml(href)}" style="color:${GREEN_DARK};text-decoration:none;">${softBreak(href.replace(/^https?:\/\//, ""))}</a>`);
}

export function dataRow(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return infoRow(label, typeof value === "string" && /^\S+@\S+$/.test(value) ? softBreak(value) : escapeHtml(value));
}

export function dataTable(rows: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;border-collapse:separate;border-spacing:0;background:${SOFT};border:1px solid ${LINE};border-radius:14px;overflow:hidden;">${rows}</table>`;
}

export function bulletList(items: string[]) {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="width:22px;vertical-align:top;padding:2px 0 10px;"><span style="display:inline-block;width:8px;height:8px;margin-top:7px;border-radius:999px;background:${GREEN};"></span></td><td style="padding:0 0 10px;font-size:15px;line-height:1.6;color:${INK};">${item}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">${rows}</table>`;
}

/** Numaralı adım kartları (1, 2, 3 …); her öğe HTML olabilir. */
export function stepList(items: string[]) {
  const rows = items
    .map(
      (item, i) =>
        `<tr><td style="padding:0 0 12px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;"><tr><td style="width:44px;vertical-align:top;padding:16px 0 16px 16px;"><div style="width:32px;height:32px;line-height:32px;text-align:center;border-radius:999px;background:${DARK};background-image:linear-gradient(135deg,${DARK} 0%,${DARK_2} 100%);color:${NEON};font-size:14px;font-weight:700;font-family:${FONT_STACK};">${i + 1}</div></td><td style="padding:16px 18px 16px 12px;font-size:14px;line-height:1.65;color:${INK};">${item}</td></tr></table></td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;">${rows}</table>`;
}

export function noteBox(text: string) {
  return `<div style="margin:0 0 22px;padding:16px 18px;border-radius:14px;background:${MINT};border:1px solid #BBF0D9;font-size:14px;line-height:1.65;color:#064E3B;">${text}</div>`;
}

export interface EmailHero {
  /** Başlığın üstündeki küçük etiket (ör. "HOŞ GELDİNİZ"). */
  eyebrow?: string;
  /** Düz metin; kaçışlanır. */
  title: string;
  /** Başlık altı kısa açıklama; düz metin. */
  subtitle?: string;
}

function renderHero(hero?: EmailHero) {
  const logo = `<img src="${LOGO_URL}" width="168" height="43" alt="eKatalox" style="display:block;width:168px;height:auto;border:0;outline:none;color:#FFFFFF;font-size:22px;font-weight:700;font-family:${FONT_STACK};">`;
  if (!hero) {
    return `<tr><td bgcolor="${DARK}" style="background:${DARK};background-image:linear-gradient(135deg,${DARK} 0%,${DARK_2} 100%);padding:22px 32px;">${logo}</td></tr>`;
  }
  const eyebrow = hero.eyebrow
    ? `<div style="display:inline-block;margin:0 0 14px;padding:6px 12px;border-radius:999px;background:rgba(16,245,154,0.12);border:1px solid rgba(16,245,154,0.35);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${NEON};">${escapeHtml(hero.eyebrow)}</div>`
    : "";
  const subtitle = hero.subtitle
    ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#B8C4D3;">${escapeHtml(hero.subtitle)}</p>`
    : "";
  return `<tr><td bgcolor="${DARK}" style="background:${DARK};background-image:radial-gradient(circle at 85% 0%,rgba(16,245,154,0.22) 0%,rgba(16,245,154,0) 45%),linear-gradient(135deg,${DARK} 0%,${DARK_2} 70%,#0B3B2E 100%);padding:30px 32px 38px;">
${logo}
<div style="height:30px;line-height:30px;font-size:0;">&nbsp;</div>
${eyebrow}
<h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:#FFFFFF;font-family:${FONT_STACK};">${escapeHtml(hero.title)}</h1>
${subtitle}
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${GREEN};background-image:linear-gradient(90deg,${NEON} 0%,${GREEN} 50%,${GREEN_DARK} 100%);">&nbsp;</td></tr>`;
}

export function renderEmailLayout(params: { title: string; bodyHtml: string; preheader?: string; hero?: EmailHero }) {
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(params.preheader)}</div>`
    : "";
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
${preheader}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${PAPER}" style="background:${PAPER};">
<tr><td align="center" style="padding:28px 12px 36px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(11,18,32,0.10);">
${renderHero(params.hero)}
<tr><td style="padding:34px 32px 12px;font-family:${FONT_STACK};">
${params.bodyHtml}
</td></tr>
<tr><td style="padding:0 32px 30px;font-family:${FONT_STACK};">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${SOFT};border-radius:14px;"><tr><td style="padding:16px 18px;font-size:13px;line-height:1.6;color:${MUTED};">
Bir sorunuz mu var? Size bir mesaj kadar yakınız.<br>
<a href="${SITE.whatsappHref}" style="display:inline-block;margin-top:10px;padding:9px 16px;border-radius:999px;background:#25D366;color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;font-family:${FONT_STACK};">WhatsApp'tan yazın</a>
</td></tr></table>
</td></tr>
<tr><td bgcolor="${DARK}" style="background:${DARK};padding:24px 32px;font-family:${FONT_STACK};font-size:12px;line-height:1.8;color:#8D9AAD;">
<a href="mailto:${SITE.supportEmail}" style="color:#D6DEE8;text-decoration:none;">${SITE.supportEmail}</a> &nbsp;·&nbsp; <a href="${SITE.phoneHref}" style="color:#D6DEE8;text-decoration:none;">${SITE.phone}</a><br>
<a href="${SITE.url}" style="color:${NEON};text-decoration:none;font-weight:600;">${SITE.domain}</a> &nbsp;·&nbsp; Toptancılar için şifreli bayi kataloğu ve WhatsApp sipariş<br>
<span style="color:#5E6B7E;">© ${year} eKatalox</span>
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
