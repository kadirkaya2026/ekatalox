// Deneme bitimine ~5 gün kala hatırlatma (app/api/cron/trial-reminder).
import { formatTry } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";
import {
  bulletList,
  button,
  dataRow,
  dataTable,
  escapeHtml,
  formatDateTr,
  heading,
  paragraph,
  renderEmailLayout,
  renderEmailText,
  subheading,
} from "@/lib/email/layout";

export interface TrialEndingEmailParams {
  businessName: string;
  contactName: string | null;
  trialEndsAt: string;
  planName: string;
  billingPeriod: "monthly" | "yearly";
  price: number;
  couponCode: string | null;
  panelUrl: string;
}

export function buildTrialEndingEmail(params: TrialEndingEmailParams) {
  const endLabel = formatDateTr(params.trialEndsAt);
  const periodLabel = params.billingPeriod === "yearly" ? "yıl" : "ay";
  const greeting = params.contactName ? `Merhaba ${params.contactName},` : "Merhaba,";

  const bodyHtml = [
    heading("Deneme süreniz bitmek üzere"),
    paragraph(escapeHtml(greeting)),
    paragraph(
      `<strong>${escapeHtml(params.businessName)}</strong> mağazanızın ücretsiz deneme süresi <strong>${escapeHtml(endLabel)}</strong> tarihinde doluyor. Mağazanızın kesintisiz açık kalması için paketinizi bu tarihe kadar aktifleştirmeniz yeterli.`,
    ),
    subheading("Paketiniz"),
    dataTable(
      [
        dataRow("Paket", params.planName),
        dataRow("Ücret", `${formatTry(params.price)} / ${periodLabel}`),
        params.couponCode ? dataRow("Kupon", params.couponCode) : "",
        dataRow("Deneme bitiş", endLabel),
      ].join(""),
    ),
    subheading("Nasıl ödenir?"),
    bulletList([
      `<strong>Havale / EFT:</strong> Temsilciniz banka bilgilerini ve faturayı iletir; dekontu WhatsApp'tan paylaşmanız yeterli.`,
      `<strong>Temsilci görüşmesi:</strong> Kararsızsanız ya da paket değiştirmek isterseniz <a href="${SITE.phoneHref}" style="color:#157A5B;">${SITE.phone}</a> numarasından bizi arayın ya da <a href="${SITE.whatsappHref}" style="color:#157A5B;">WhatsApp'tan yazın</a>.`,
    ]),
    button(params.panelUrl, "Panele git"),
    paragraph(
      "Deneme bitince mağazanız geçici olarak kapanır; ödeme sonrası aynı adres ve ürünlerle kaldığı yerden devam eder. Hiçbir veriniz silinmez.",
    ),
  ].join("");

  const text = renderEmailText([
    greeting,
    "",
    `${params.businessName} mağazanızın ücretsiz deneme süresi ${endLabel} tarihinde doluyor.`,
    "",
    `Paket: ${params.planName}`,
    `Ücret: ${formatTry(params.price)} / ${periodLabel}`,
    ...(params.couponCode ? [`Kupon: ${params.couponCode}`] : []),
    "",
    "Nasıl ödenir?",
    "- Havale / EFT: temsilciniz banka bilgilerini iletir, dekontu WhatsApp'tan paylaşın.",
    `- Temsilci: ${SITE.phone} (arama veya WhatsApp).`,
    "",
    `Panel: ${params.panelUrl}`,
    "Deneme bitince mağazanız geçici olarak kapanır; ödeme sonrası kaldığı yerden devam eder.",
  ]);

  return {
    subject: `Deneme süreniz ${endLabel} tarihinde bitiyor — ${params.businessName}`,
    html: renderEmailLayout({ title: "Deneme süreniz bitmek üzere", bodyHtml }),
    text,
  };
}
