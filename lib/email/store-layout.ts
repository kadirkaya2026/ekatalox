// Mağaza adına giden müşteri e-postaları (17 Eki 2026): tüm mağazalarda ORTAK,
// sade bir tema; yalnız mağazanın logosu ve adı değişir. eKatalox markası yalnız
// en altta küçük "altyapı" satırında. (Platform e-postaları lib/email/layout.ts.)
//
// E-posta istemcisi kuralları: tablo + satır içi stil; SVG logo gösterilmez
// (Gmail/Outlook) → logo yoksa ya da SVG ise baş harfli rozet.
import { escapeHtml } from "@/lib/email/layout";
import type { OrderStatus } from "@/lib/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const INK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";
const PAPER = "#F3F4F6";

export type StoreBrand = {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  /** wa.me için yalnız rakam. */
  whatsapp: string | null;
};

function initials(name: string) {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[1][0] : "")).toLocaleUpperCase("tr-TR") || "•";
}

function renderLogo(brand: StoreBrand) {
  const usable = brand.logoUrl && /^https:\/\//.test(brand.logoUrl) && !/\.svg(\?|$)/i.test(brand.logoUrl);
  if (usable) {
    return `<img src="${escapeHtml(brand.logoUrl!)}" width="72" height="72" alt="${escapeHtml(brand.name)}" style="display:block;margin:0 auto;width:72px;height:72px;object-fit:contain;border-radius:18px;border:1px solid ${LINE};background:#FFFFFF;">`;
  }
  return `<div style="margin:0 auto;width:72px;height:72px;line-height:72px;border-radius:18px;background:${INK};color:#FFFFFF;font-size:26px;font-weight:700;text-align:center;font-family:${FONT};">${escapeHtml(initials(brand.name))}</div>`;
}

export function renderStoreEmailLayout(params: {
  brand: StoreBrand;
  title: string;
  preheader?: string;
  bodyHtml: string;
  /** Alt bilginin üstündeki "neden bu e-postayı aldınız" satırı. */
  reason?: string;
}) {
  const { brand } = params;
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(params.preheader)}</div>`
    : "";
  const pill = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px;padding:10px 18px;border-radius:999px;border:1px solid ${LINE};color:${INK};font-size:14px;font-weight:600;text-decoration:none;">${label}</a>`;
  const contacts = [
    brand.phone ? pill(`tel:${brand.phone.replace(/\s/g, "")}`, "📞 Ara") : "",
    brand.whatsapp ? pill(`https://wa.me/${brand.whatsapp}`, "💬 WhatsApp") : "",
  ].join("");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${FONT};-webkit-font-smoothing:antialiased;">
${preheader}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${PAPER}" style="background:${PAPER};">
<tr><td align="center" style="padding:28px 12px 32px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid ${LINE};">
<tr><td align="center" style="padding:28px 28px 8px;font-family:${FONT};">
${renderLogo(brand)}
<div style="margin-top:12px;font-size:18px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(brand.name)}</div>
</td></tr>
<tr><td style="padding:18px 28px 8px;font-family:${FONT};">
${params.bodyHtml}
</td></tr>
${
  contacts
    ? `<tr><td align="center" style="padding:6px 28px 26px;font-family:${FONT};">
<div style="font-size:13px;color:${MUTED};margin-bottom:6px;">Sorunuz mu var? ${escapeHtml(brand.name)} bir mesaj uzağınızda.</div>
${contacts}
</td></tr>`
    : ""
}
<tr><td style="padding:18px 28px 22px;border-top:1px solid ${LINE};font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
${params.reason ? `${escapeHtml(params.reason)}<br>` : ""}
<span style="color:#9CA3AF;">eKatalox altyapısıyla gönderildi</span>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Sipariş durumu ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<OrderStatus, { color: string; soft: string; emoji: string }> = {
  new: { color: "#2563EB", soft: "#EFF6FF", emoji: "🧾" },
  confirmed: { color: "#2563EB", soft: "#EFF6FF", emoji: "✅" },
  preparing: { color: "#D97706", soft: "#FFFBEB", emoji: "🛒" },
  shipped: { color: "#EA580C", soft: "#FFF7ED", emoji: "🛵" },
  delivered: { color: "#16A34A", soft: "#F0FDF4", emoji: "🎉" },
  cancelled: { color: "#DC2626", soft: "#FEF2F2", emoji: "✖️" },
};

const TRACK_STEPS: Array<{ status: OrderStatus; label: string; tekelLabel?: string }> = [
  { status: "confirmed", label: "Onaylandı" },
  { status: "preparing", label: "Hazırlanıyor" },
  { status: "shipped", label: "Yola çıktı", tekelLabel: "Hazır" },
  { status: "delivered", label: "Teslim edildi" },
];

function renderTracker(status: OrderStatus, isTekel: boolean) {
  const current = TRACK_STEPS.findIndex((step) => step.status === status);
  const { color } = STATUS_STYLE[status];
  const cells = TRACK_STEPS.map((step, index) => {
    const done = index <= current;
    const dot = `<div style="margin:0 auto;width:22px;height:22px;line-height:22px;border-radius:999px;background:${done ? color : "#FFFFFF"};border:2px solid ${done ? color : LINE};color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;">${done ? "✓" : ""}</div>`;
    const label = isTekel && step.tekelLabel ? step.tekelLabel : step.label;
    return `<td width="25%" align="center" style="vertical-align:top;padding:0 2px;">${dot}<div style="margin-top:6px;font-size:11px;line-height:1.3;font-weight:${index === current ? 700 : 500};color:${done ? INK : "#9CA3AF"};">${label}</div></td>`;
  }).join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:18px 0 4px;"><tr>${cells}</tr></table>`;
}

export function buildStoreOrderStatusEmail(params: {
  brand: StoreBrand;
  customerName: string | null;
  orderNo: string;
  status: OrderStatus;
  statusLabel: string;
  statusTitle: string;
  description: string;
  isTekel: boolean;
  trackingUrl: string | null;
  cancelReason?: string | null;
}) {
  const style = STATUS_STYLE[params.status];
  const firstName = params.customerName?.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Merhaba ${firstName},` : "Merhaba,";
  const reason = params.status === "cancelled" && params.cancelReason ? params.cancelReason : null;

  const bodyHtml = [
    // Selamlama belirgin (17 Eki 2026, kullanıcı: "soluk kalmış").
    `<div style="margin:0 0 4px;font-size:20px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(firstName ? `Merhaba ${firstName} 👋` : "Merhaba 👋")}</div>`,
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">Siparişinizle ilgili bir güncelleme var.</p>`,
    `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${style.soft};border-radius:16px;"><tr><td align="center" style="padding:22px 18px 18px;">
<div style="font-size:38px;line-height:1;">${style.emoji}</div>
<div style="margin-top:10px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(params.statusTitle)}</div>
<div style="margin-top:6px;display:inline-block;padding:4px 12px;border-radius:999px;background:#FFFFFF;color:${style.color};font-size:13px;font-weight:700;">Sipariş ${escapeHtml(params.orderNo)}</div>
<div style="margin-top:10px;font-size:14px;line-height:1.6;color:#374151;">${escapeHtml(params.description)}</div>
${reason ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:#991B1B;"><strong>İptal sebebi:</strong> ${escapeHtml(reason)}</div>` : ""}
${params.status === "cancelled" ? "" : renderTracker(params.status, params.isTekel)}
</td></tr></table>`,
    params.trackingUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:22px auto 6px;"><tr><td bgcolor="${INK}" style="border-radius:999px;background:${INK};"><a href="${escapeHtml(params.trackingUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;font-family:${FONT};">Siparişimi takip et &rarr;</a></td></tr></table>`
      : "",
  ].join("");

  const html = renderStoreEmailLayout({
    brand: params.brand,
    title: `Sipariş ${params.orderNo} · ${params.statusLabel}`,
    preheader: params.description,
    bodyHtml,
    reason: `Bu e-postayı ${params.brand.name} üyeliğinizde e-posta bildirimini açtığınız için aldınız. Hesabım › Bildirimler'den kapatabilirsiniz.`,
  });
  const text = [
    greeting,
    "",
    `${params.statusTitle} — Sipariş ${params.orderNo}`,
    params.description,
    ...(reason ? [`İptal sebebi: ${reason}`] : []),
    ...(params.trackingUrl ? ["", `Takip: ${params.trackingUrl}`] : []),
    "",
    `— ${params.brand.name}`,
    ...(params.brand.phone ? [`Telefon: ${params.brand.phone}`] : []),
  ].join("\n");

  return { subject: `${params.statusTitle} · Sipariş ${params.orderNo}`, html, text };
}
