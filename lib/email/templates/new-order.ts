// "Yeni sipariş" e-postası (14 Eki 2026): ücretli planlarda her siparişte
// toptancının bildirim adresine (tenants.contact_email) gider. Ürün satırları
// küçük görselli; fiyatsız (katalog) siparişte tutar sütunu yok.
import { formatCurrency } from "@/lib/utils";
import {
  button,
  escapeHtml,
  noteBox,
  paragraph,
  renderEmailLayout,
  renderEmailText,
  subheading,
} from "@/lib/email/layout";

const MAX_ITEMS = 40;

export interface NewOrderEmailItem {
  name: string;
  variantName?: string | null;
  code?: string | null;
  quantity: number;
  unitLabel?: string | null;
  /** Satır tutarı (adet × birim); fiyatsız siparişte null. */
  lineTotal: number | null;
  imageUrl?: string | null;
  isGift?: boolean;
}

export interface NewOrderEmailParams {
  businessName: string;
  /** "market": hazırlanıyor/yola çıktı bildirimleri; diğerleri: onayla/düzelt/iptal. */
  businessType?: string | null;
  orderNo: number | null;
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
  paymentLabel?: string | null;
  currency: string;
  items: NewOrderEmailItem[];
  /** Ara toplam, indirim, getirme ücreti… (tutar negatifse indirim). */
  totals: { label: string; amount: number }[];
  finalTotal: number;
  ordersUrl: string;
  settingsUrl: string;
}

const INK = "#162033";
const MUTED = "#5C6B7A";
const LINE = "#E3E8EF";
const SOFT = "#F6F8FB";
const GREEN_DARK = "#047857";

function money(value: number, currency: string) {
  return formatCurrency(value, currency as Parameters<typeof formatCurrency>[1]);
}

function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function waHref(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `9${digits}`;
  else if (digits.length === 10) digits = `90${digits}`;
  return `https://wa.me/${digits}`;
}

function customerCard(params: NewOrderEmailParams) {
  const rows: string[] = [
    `<div style="font-size:17px;line-height:1.35;font-weight:700;color:${INK};">${escapeHtml(params.customerName)}</div>`,
  ];
  if (params.customerPhone) {
    rows.push(
      `<div style="margin-top:6px;font-size:14px;line-height:1.5;"><a href="${escapeHtml(telHref(params.customerPhone))}" style="color:${GREEN_DARK};font-weight:600;text-decoration:none;">${escapeHtml(params.customerPhone)}</a>&nbsp;&nbsp;<a href="${escapeHtml(waHref(params.customerPhone))}" style="display:inline-block;padding:3px 10px;border-radius:999px;background:#25D366;color:#FFFFFF;font-size:12px;font-weight:700;text-decoration:none;">WhatsApp</a></div>`,
    );
  }
  if (params.customerAddress) {
    rows.push(`<div style="margin-top:8px;font-size:14px;line-height:1.55;color:${MUTED};">${escapeHtml(params.customerAddress)}</div>`);
  }
  const meta = [formatOrderDate(params.orderDate), params.paymentLabel]
    .filter((v): v is string => Boolean(v))
    .map((v) => escapeHtml(v));
  rows.push(`<div style="margin-top:10px;font-size:12px;line-height:1.5;color:${MUTED};">${meta.join(" &nbsp;·&nbsp; ")}</div>`);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;background:${SOFT};border:1px solid ${LINE};border-radius:14px;"><tr><td style="padding:16px 18px;"><div style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Müşteri</div>${rows.join("")}</td></tr></table>`;
}

function itemRows(params: NewOrderEmailParams) {
  const catalog = params.currency === "CATALOG";
  const rows = params.items
    .slice(0, MAX_ITEMS)
    .map((item) => {
      const thumb = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" width="52" height="52" alt="" style="display:block;width:52px;height:52px;object-fit:cover;border-radius:10px;border:1px solid ${LINE};background:#FFFFFF;">`
        : `<div style="width:52px;height:52px;border-radius:10px;background:${SOFT};border:1px solid ${LINE};"></div>`;
      const sub = [item.variantName, item.code]
        .filter((v): v is string => Boolean(v))
        .map((v) => escapeHtml(v))
        .join(" · ");
      const qty = `${item.quantity.toLocaleString("tr-TR")} ${escapeHtml(item.unitLabel || "adet")}`;
      const amount = item.isGift
        ? `<span style="color:${GREEN_DARK};font-weight:700;">Hediye</span>`
        : !catalog && item.lineTotal !== null
          ? escapeHtml(money(item.lineTotal, params.currency))
          : "";
      return `<tr>
<td style="width:52px;padding:12px 0;border-bottom:1px solid ${LINE};vertical-align:top;">${thumb}</td>
<td style="padding:12px;border-bottom:1px solid ${LINE};vertical-align:top;"><div style="font-size:14px;line-height:1.4;font-weight:600;color:${INK};">${escapeHtml(item.name)}</div>${sub ? `<div style="margin-top:2px;font-size:12px;line-height:1.4;color:${MUTED};">${sub}</div>` : ""}<div style="margin-top:4px;font-size:13px;color:${MUTED};">${qty}</div></td>
<td align="right" style="padding:12px 0;border-bottom:1px solid ${LINE};vertical-align:top;white-space:nowrap;font-size:14px;font-weight:700;color:${INK};">${amount}</td>
</tr>`;
    })
    .join("");
  const more =
    params.items.length > MAX_ITEMS
      ? `<tr><td colspan="3" style="padding:12px 0;font-size:13px;color:${MUTED};">+ ${params.items.length - MAX_ITEMS} ürün daha; tamamı panelde ve WhatsApp'a gelen fişte.</td></tr>`
      : "";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 8px;">${rows}${more}</table>`;
}

function totalsBlock(params: NewOrderEmailParams) {
  if (params.currency === "CATALOG") {
    return `<div style="margin:0 0 24px;padding:14px 18px;border-radius:14px;background:${SOFT};font-size:14px;color:${MUTED};">Fiyatsız sipariş listesi; tutar fişte yer almaz.</div>`;
  }
  const lines = params.totals
    .map(
      (t) =>
        `<tr><td style="padding:4px 0;font-size:14px;color:${MUTED};">${escapeHtml(t.label)}</td><td align="right" style="padding:4px 0;font-size:14px;color:${t.amount < 0 ? GREEN_DARK : INK};white-space:nowrap;">${t.amount < 0 ? "−" : ""}${escapeHtml(money(Math.abs(t.amount), params.currency))}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
${lines}
<tr><td colspan="2" style="padding:10px 0 0;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#0B1220" style="background:#0B1220;background-image:linear-gradient(135deg,#0B1220 0%,#0E2A35 100%);border-radius:14px;"><tr>
<td style="padding:16px 18px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#B8C4D3;">Toplam</td>
<td align="right" style="padding:16px 18px;font-size:22px;font-weight:700;color:#10F59A;white-space:nowrap;">${escapeHtml(money(params.finalTotal, params.currency))}</td>
</tr></table></td></tr>
</table>`;
}

/** Panelde siparişle ne yapılabileceği; market ile toptancı akışı farklı. */
export function orderActionsText(businessType: string | null | undefined) {
  return businessType === "market"
    ? "Panelden “hazırlanıyor” ve “yola çıktı” bildirimlerini tek tuşla müşterinize gönderebilirsiniz."
    : "Panelden siparişi tek tuşla onaylayabilir, düzeltebilir ya da iptal edebilirsiniz.";
}

export function buildNewOrderEmail(params: NewOrderEmailParams) {
  const catalog = params.currency === "CATALOG";
  const orderLabel = params.orderNo ? `#${params.orderNo}` : params.orderNumber;
  const itemCount = params.items.length;
  const totalText = catalog ? "fiyatsız liste" : money(params.finalTotal, params.currency);

  const bodyHtml = [
    customerCard(params),
    subheading(`Sipariş içeriği · ${itemCount} kalem`),
    itemRows(params),
    totalsBlock(params),
    params.note ? noteBox(`<strong>Müşteri notu:</strong> ${escapeHtml(params.note)}`) : "",
    button(params.ordersUrl, "Siparişi panelde aç"),
    paragraph(
      `<span style="font-size:13px;color:${MUTED};">Sipariş fişi WhatsApp numaranıza da PDF olarak iletildi. ${orderActionsText(params.businessType)}</span>`,
    ),
    paragraph(
      `<span style="font-size:12px;color:${MUTED};">Bu e-postaları almak istemiyorsanız <a href="${escapeHtml(params.settingsUrl)}" style="color:${MUTED};text-decoration:underline;">Ayarlar → E-posta Bildirimleri</a> sayfasından kapatabilirsiniz.</span>`,
    ),
  ].join("");

  const lines = [
    `Yeni sipariş ${orderLabel} · ${params.businessName}`,
    "",
    `Müşteri: ${params.customerName}`,
    ...(params.customerPhone ? [`Telefon: ${params.customerPhone}`] : []),
    ...(params.customerAddress ? [`Adres: ${params.customerAddress}`] : []),
    ...(params.paymentLabel ? [`Ödeme: ${params.paymentLabel}`] : []),
    "",
    ...params.items.slice(0, MAX_ITEMS).map((item) => {
      const amount = item.isGift
        ? "Hediye"
        : !catalog && item.lineTotal !== null
          ? money(item.lineTotal, params.currency)
          : "";
      return `- ${item.name}${item.variantName ? ` (${item.variantName})` : ""} × ${item.quantity}${amount ? ` · ${amount}` : ""}`;
    }),
    ...(params.items.length > MAX_ITEMS ? [`+ ${params.items.length - MAX_ITEMS} ürün daha`] : []),
    "",
    catalog ? "Fiyatsız sipariş listesi" : `Toplam: ${money(params.finalTotal, params.currency)}`,
    ...(params.note ? [`Müşteri notu: ${params.note}`] : []),
    "",
    `Panelde aç: ${params.ordersUrl}`,
  ];

  return {
    subject: `Yeni sipariş ${orderLabel} · ${params.customerName} · ${totalText}`,
    html: renderEmailLayout({
      title: `Yeni sipariş ${orderLabel}`,
      preheader: `${params.customerName} · ${itemCount} kalem · ${totalText}`,
      hero: {
        eyebrow: "Yeni sipariş",
        title: `${orderLabel} · ${totalText}`,
        subtitle: `${params.customerName}, ${params.businessName} mağazanızdan ${itemCount} kalem sipariş verdi.`,
      },
      bodyHtml,
    }),
    text: renderEmailText(lines),
  };
}
