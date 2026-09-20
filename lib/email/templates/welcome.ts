// Karşılama e-postası: kayıt tamamlandığında toptancıya gider (20 Eyl 2026
// freemium). Hesap Ücretsiz planla açılır; ücretli paket seçildiyse
// "sizi arayacağız" notu düşer.
import { formatTry } from "@/lib/billing/toptan-plans";
import { SITE } from "@/lib/marketing/site";
import {
  bulletList,
  button,
  dataRow,
  dataTable,
  escapeHtml,
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
}

export function buildWelcomeEmail(params: WelcomeEmailParams) {
  const paidRequested = params.requestedPlanPrice > 0;

  const bodyHtml = [
    heading(`Kataloğunuz hazır, ${escapeHtml(params.fullName)}!`),
    paragraph(
      `<strong>${escapeHtml(params.businessName)}</strong> için online kataloğunuz Ücretsiz planla açıldı. Bayileriniz aşağıdaki adresten şifreyle girip sipariş verebilir.`,
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
          `<strong>${escapeHtml(params.requestedPlanName)} paketi</strong> talebiniz bize ulaştı (${escapeHtml(formatTry(params.requestedPlanPrice))} / yıl, KDV hariç). Temsilcimiz en kısa sürede arayıp ödeme bilgisini iletecek; ödeme sonrası paketiniz açılır ve reklamlar kalkar. O zamana kadar Ücretsiz planı kullanmaya devam edebilirsiniz.`,
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
    `${params.businessName} için online kataloğunuz Ücretsiz planla açıldı.`,
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
      ? `${params.requestedPlanName} paketi talebiniz alındı (${formatTry(params.requestedPlanPrice)} / yıl, KDV hariç). Temsilcimiz arayıp ödeme bilgisini iletecek.`
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
