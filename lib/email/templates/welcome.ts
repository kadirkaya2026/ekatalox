// Karşılama e-postası: kayıt tamamlandığında toptancıya gider. Ücretsiz seçen
// Ücretsiz planla açılır; ücretli paket seçen o paketle 14 gün denemede açılır
// (25 Eyl 2026) ve "sizi arayacağız, ödeme gelmezse Ücretsiz plana geçer" notu düşer.
import { PAID_PLAN_TRIAL_DAYS } from "@/lib/billing/plan-trial";
import { formatTry } from "@/lib/billing/toptan-plans";
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
  requestedPlanName: string;
  requestedPlanPrice: number;
  /** Ücretli paket denemesinin bitişi; Ücretsiz seçildiyse null. */
  planTrialEndsAt: string | null;
}

export function buildWelcomeEmail(params: WelcomeEmailParams) {
  const paidRequested = params.requestedPlanPrice > 0;
  const trialEnd = formatDateTr(params.planTrialEndsAt);
  const planLabel = paidRequested ? `${params.requestedPlanName} paketiyle` : "Ücretsiz planla";

  const bodyHtml = [
    heading(`Kataloğunuz hazır, ${escapeHtml(params.fullName)}!`),
    paragraph(
      `<strong>${escapeHtml(params.businessName)}</strong> için online kataloğunuz ${escapeHtml(planLabel)} açıldı${paidRequested ? ` (${PAID_PLAN_TRIAL_DAYS} gün deneme)` : ""}. Bayileriniz aşağıdaki adresten şifreyle girip sipariş verebilir.`,
    ),
    dataTable(
      [
        linkRow("Katalog adresiniz", params.storeUrl),
        linkRow("Yönetim paneli", params.panelUrl),
        dataRow("Giriş e-postanız", params.email),
      ].join(""),
    ),
    button(params.panelUrl, "Yönetim paneline gir"),
    noteBox(
      `Panele kayıt sırasında belirlediğiniz şifreyle giriş yapın. Şifrenizi unutursanız giriş ekranındaki <strong>“Şifremi unuttum”</strong> bağlantısını kullanabilirsiniz.`,
    ),
    subheading("İlk üç adım"),
    bulletList([
      `<strong>Ürünlerinizi yükleyin.</strong> Panelde Ürünler &gt; Excel ile yükle. Mevcut PDF ya da Excel kataloğunuzu bu e-postaya yanıt olarak gönderirseniz ilk yüklemeyi biz yaparız.`,
      `<strong>Bayi şifrenizi belirleyin.</strong> Ayarlar &gt; Şifreler. Şifreyi ve katalog adresini bayilerinize WhatsApp'tan gönderin.`,
      `<strong>Siparişleri WhatsApp'tan alın.</strong> Bayi sepetini doldurup gönderdiğinde sipariş fişi PDF olarak WhatsApp numaranıza düşer.`,
    ]),
    paidRequested
      ? noteBox(
          `<strong>${escapeHtml(params.requestedPlanName)} paketi</strong> ${PAID_PLAN_TRIAL_DAYS} gün boyunca tüm özellikleriyle, reklamsız açık${trialEnd ? ` (${escapeHtml(trialEnd)} tarihine kadar)` : ""}. Temsilcimiz arayıp ödeme bilgisini iletecek (${escapeHtml(formatTry(params.requestedPlanPrice))} / yıl, KDV hariç). Ödeme alınınca paketiniz kalıcı olur; ödeme gelmezse deneme bitiminde kataloğunuz kapanmaz, Ücretsiz plana geçer.`,
        )
      : paragraph(
          `Ücretsiz planda kataloğunuzda küçük eKatalox tanıtımları görünür. Reklamsız kullanmak ya da ürün limitini artırmak isterseniz paneldeki Paketim sayfasından ya da bize yazarak istediğiniz zaman paket seçebilirsiniz.`,
        ),
    paragraph(
      `Bir sorunuz olursa bu e-postayı yanıtlayın ya da <a href="${SITE.whatsappHref}" style="color:#157A5B;">WhatsApp'tan yazın</a>. Hoş geldiniz!`,
    ),
  ].join("");

  const text = renderEmailText([
    `Kataloğunuz hazır, ${params.fullName}!`,
    "",
    `${params.businessName} için online kataloğunuz ${planLabel} açıldı${paidRequested ? ` (${PAID_PLAN_TRIAL_DAYS} gün deneme)` : ""}.`,
    `Katalog adresiniz: ${params.storeUrl}`,
    `Yönetim paneli: ${params.panelUrl}`,
    `Giriş e-postanız: ${params.email}`,
    "Panele kayıt sırasında belirlediğiniz şifreyle giriş yapın.",
    "",
    "İlk üç adım:",
    "- Ürünlerinizi yükleyin (Excel ile ya da PDF/Excel'inizi bize gönderin, biz yükleyelim).",
    "- Bayi şifrenizi belirleyin ve katalog adresiyle birlikte bayilerinize gönderin.",
    "- Siparişler WhatsApp numaranıza PDF olarak gelir.",
    "",
    paidRequested
      ? `${params.requestedPlanName} paketi ${PAID_PLAN_TRIAL_DAYS} gün deneme olarak açık${trialEnd ? ` (${trialEnd} tarihine kadar)` : ""}. Temsilcimiz arayıp ödeme bilgisini iletecek (${formatTry(params.requestedPlanPrice)} / yıl, KDV hariç); ödeme gelmezse Ücretsiz plana geçersiniz.`
      : "Ücretsiz planda kataloğunuzda küçük eKatalox tanıtımları görünür; istediğiniz zaman paket seçebilirsiniz.",
  ]);

  return {
    subject: `${params.businessName} kataloğunuz hazır — eKatalox`,
    html: renderEmailLayout({
      title: "Kataloğunuz hazır",
      preheader: `${params.storeUrl} adresinde kataloğunuz açıldı.`,
      bodyHtml,
    }),
    text,
  };
}
