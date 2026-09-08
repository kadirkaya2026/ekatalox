// Karşılama e-postası: kayıt tamamlandığında esnafa gider.
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
  linkRow,
  noteBox,
  paragraph,
  renderEmailLayout,
  renderEmailText,
  subheading,
} from "@/lib/email/layout";

export interface WelcomeEmailParams {
  fullName: string;
  businessName: string;
  email: string;
  storeUrl: string;
  panelUrl: string;
  trialEndsAt: string | null;
  planName: string;
  billingPeriod: "monthly" | "yearly";
  listPrice: number;
  finalPrice: number;
  couponCode: string | null;
}

function periodLabel(period: "monthly" | "yearly") {
  return period === "yearly" ? "yıllık" : "aylık";
}

export function buildWelcomeEmail(params: WelcomeEmailParams) {
  const trialLabel = formatDateTr(params.trialEndsAt);
  const priceLabel =
    params.couponCode && params.finalPrice !== params.listPrice
      ? `${formatTry(params.finalPrice)} / ${periodLabel(params.billingPeriod)} (${params.couponCode} kuponuyla, liste ${formatTry(params.listPrice)})`
      : `${formatTry(params.listPrice)} / ${periodLabel(params.billingPeriod)}`;

  const bodyHtml = [
    heading(`Mağazanız hazır, ${params.fullName}!`),
    paragraph(
      `<strong>${escapeHtml(params.businessName)}</strong> için sipariş sayfanız açıldı. Müşterileriniz aşağıdaki adresten dükkânınızı gezip siparişlerini WhatsApp'ınıza gönderebilir.`,
    ),
    dataTable(
      [
        linkRow("Mağaza adresiniz", params.storeUrl),
        linkRow("Yönetim paneli", params.panelUrl),
        dataRow("Giriş e-postanız", params.email),
      ].join(""),
    ),
    button(params.panelUrl, "Yönetim paneline gir"),
    noteBox(
      `Panele kayıt sırasında belirlediğiniz şifreyle giriş yapın. Şifrenizi unutursanız giriş ekranındaki <strong>“Şifremi unuttum”</strong> bağlantısını kullanabilirsiniz.`,
    ),
    subheading("Sırada ne var?"),
    bulletList([
      `<strong>Ürünlerinizi biz yükleriz.</strong> Temsilcimiz ${escapeHtml(SITE.setupHours)} saat içinde sizi arayıp ürün listenizi ve fotoğraflarınızı alacak; mağazanız ürünleriyle hazır olacak.`,
      `<strong>QR magnetleriniz kargoya verilir.</strong> Paketinize dahil magnetler adresinize gönderilir; müşterileriniz buzdolabındaki QR'ı okutup sipariş verir.`,
      trialLabel
        ? `<strong>Ücretsiz deneme ${escapeHtml(trialLabel)} tarihine kadar.</strong> Ödeme bilgisi istemedik; deneme bitmeden temsilcimiz sizinle görüşür.`
        : `<strong>Deneme süreniz başladı.</strong> Bitmeden temsilcimiz sizinle görüşür.`,
    ]),
    subheading("Seçtiğiniz paket"),
    dataTable(
      [
        dataRow("Paket", params.planName),
        dataRow("Ücret", priceLabel),
        params.couponCode ? dataRow("Kupon", params.couponCode) : "",
        trialLabel ? dataRow("Deneme bitiş", trialLabel) : "",
      ].join(""),
    ),
    paragraph(
      `Bir sorunuz olursa bu e-postayı yanıtlayın ya da <a href="${SITE.whatsappHref}" style="color:#157A5B;">WhatsApp'tan yazın</a>. Hoş geldiniz!`,
    ),
  ].join("");

  const text = renderEmailText([
    `Mağazanız hazır, ${params.fullName}!`,
    "",
    `${params.businessName} için sipariş sayfanız açıldı.`,
    `Mağaza adresiniz: ${params.storeUrl}`,
    `Yönetim paneli: ${params.panelUrl}`,
    `Giriş e-postanız: ${params.email}`,
    "Panele kayıt sırasında belirlediğiniz şifreyle giriş yapın.",
    "",
    "Sırada ne var?",
    `- Ürünlerinizi biz yükleriz: temsilcimiz ${SITE.setupHours} saat içinde sizi arayacak.`,
    "- QR magnetleriniz kargoyla adresinize gönderilir.",
    trialLabel
      ? `- Ücretsiz deneme ${trialLabel} tarihine kadar; ödeme bilgisi istemedik.`
      : "- Deneme süreniz başladı.",
    "",
    `Paket: ${params.planName}`,
    `Ücret: ${priceLabel}`,
    ...(params.couponCode ? [`Kupon: ${params.couponCode}`] : []),
  ]);

  return {
    subject: `${params.businessName} mağazanız hazır — eKatalox`,
    html: renderEmailLayout({
      title: "Mağazanız hazır",
      preheader: `${params.storeUrl} adresinde sipariş sayfanız açıldı.`,
      bodyHtml,
    }),
    text,
  };
}
