// Satış ekibine yeni kayıt bildirimi (CONTACT_RECIPIENT). 25 Eyl 2026:
// hesap her zaman Ücretsiz açılır; formda ücretli paket seçildiyse bu bir
// TALEPTİR ve e-posta bunu konu satırında ve en üstte "yapılacaklar" kutusuyla
// öne çıkarır. Alt alan adı Vercel'e eklenemediyse (site 525 verir) kırmızı
// uyarı düşer. Kayıtta sorulmayan adres/vergi alanları gösterilmez.
import { formatTry, TOPTAN_SECTOR_OPTIONS } from "@/lib/billing/toptan-plans";
import {
  button,
  dataRow,
  dataTable,
  escapeHtml,
  heading,
  linkRow,
  paragraph,
  renderEmailLayout,
  renderEmailText,
  subheading,
} from "@/lib/email/layout";

export interface SignupNotificationParams {
  tenantId: string;
  businessName: string;
  sector: string;
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  city: string;
  subdomain: string;
  storeUrl: string;
  /** Formda seçilen paket; fiyatı 0 ise Ücretsiz. */
  requestedPlanName: string;
  requestedPlanPrice: number;
  /** Alt alan adı Vercel projesine eklendi mi (eklenmediyse site açılmaz). */
  domainOk: boolean;
  domainError?: string | null;
  ipAddress: string | null;
}

function alertBox(color: string, background: string, html: string) {
  return `<div style="margin:0 0 20px;padding:14px 16px;border-left:4px solid ${color};background:${background};font-size:14px;line-height:1.6;color:#0F172A;">${html}</div>`;
}

function digitsOnly(value: string) {
  const d = value.replace(/\D/g, "");
  return d.startsWith("0") ? `9${d}` : d.startsWith("90") ? d : `90${d}`;
}

export function buildSignupNotificationEmail(params: SignupNotificationParams) {
  const adminUrl = `https://admin.ekatalox.com/tenants/${params.tenantId}`;
  const sectorLabel = TOPTAN_SECTOR_OPTIONS.find((o) => o.value === params.sector)?.label ?? params.sector;
  const paidRequested = params.requestedPlanPrice > 0;
  const business = escapeHtml(params.businessName);
  const planLine = `${params.requestedPlanName} — ${formatTry(params.requestedPlanPrice)} / yıl (KDV hariç)`;
  const telHref = `tel:+${digitsOnly(params.phone)}`;
  const waHref = `https://wa.me/${digitsOnly(params.whatsappNumber || params.phone)}?text=${encodeURIComponent(
    `Merhaba ${params.fullName}, eKatalox'a kaydınız için teşekkürler. ${params.requestedPlanName} paketi talebiniz için yazıyorum.`,
  )}`;

  const bodyHtml = [
    heading(paidRequested ? "Ücretli paket talebi" : "Yeni kayıt"),
    paragraph(
      paidRequested
        ? `<strong>${business}</strong> kayıt oldu ve <strong>${escapeHtml(params.requestedPlanName)}</strong> paketini istedi. Kataloğu şu an <strong>Ücretsiz</strong> planla açık; ödeme alınana kadar ücretsiz planda kalır.`
        : `<strong>${business}</strong> kayıt oldu, kataloğu <strong>Ücretsiz</strong> planla açıldı.`,
    ),
    params.domainOk
      ? ""
      : alertBox(
          "#DC2626",
          "#FEF2F2",
          `<strong>Mağaza adresi açılmıyor.</strong> ${escapeHtml(params.subdomain)}.ekatalox.com Vercel projesine eklenemedi${
            params.domainError ? ` (${escapeHtml(params.domainError)})` : ""
          }; site SSL hatası (525) verir. Vercel &gt; ekatalox &gt; Domains'ten adresi ekleyin ve VERCEL_API_TOKEN'ı kontrol edin.`,
        ),
    paidRequested
      ? alertBox(
          "#D97706",
          "#FFFBEB",
          `<strong>Yapılacaklar</strong><br>1. Müşteriyi arayın: <a href="${telHref}" style="color:#0F172A;">${escapeHtml(params.phone)}</a> ya da <a href="${waHref}" style="color:#157A5B;">WhatsApp'tan yazın</a>.<br>2. Ödeme bilgisini iletin: <strong>${escapeHtml(planLine)}</strong>.<br>3. Ödeme gelince admin panelinden paketi <strong>${escapeHtml(params.requestedPlanName)}</strong> yapın; reklamlar kalkar, limitler açılır.`,
        )
      : alertBox(
          "#157A5B",
          "#F0FDF4",
          `Hoş geldin araması iyi olur: ürün yüklemesinde yardım teklif edin (PDF/Excel gönderirse ilk yüklemeyi biz yapıyoruz). Telefon: <a href="${telHref}" style="color:#0F172A;">${escapeHtml(params.phone)}</a>`,
        ),
    button(adminUrl, "Admin panelinde aç"),
    subheading("İşletme"),
    dataTable(
      [
        dataRow("İşletme adı", params.businessName),
        dataRow("Sektör", sectorLabel),
        dataRow("Yetkili", params.fullName),
        dataRow("Telefon", params.phone),
        dataRow("WhatsApp", params.whatsappNumber),
        dataRow("E-posta", params.email),
        dataRow("İl", params.city || "—"),
        linkRow("Mağaza", params.storeUrl),
      ].join(""),
    ),
    subheading("Paket"),
    dataTable(
      [
        dataRow("Şu anki plan", "Ücretsiz"),
        dataRow("İstenen paket", paidRequested ? planLine : "Ücretsiz (ücretli paket istemedi)"),
      ].join(""),
    ),
    subheading("Teknik"),
    dataTable(
      [
        dataRow("Alt alan adı", params.domainOk ? `${params.subdomain} (Vercel'e eklendi)` : `${params.subdomain} (EKLENEMEDİ)`),
        dataRow("IP", params.ipAddress ?? "—"),
        dataRow("Tenant ID", params.tenantId),
      ].join(""),
    ),
  ].join("");

  const text = renderEmailText([
    paidRequested ? `ÜCRETLİ PAKET TALEBİ: ${planLine}` : "Yeni kayıt (Ücretsiz)",
    "",
    params.domainOk ? "" : `UYARI: ${params.subdomain}.ekatalox.com Vercel'e eklenemedi, site açılmaz (525).`,
    `İşletme: ${params.businessName} (${sectorLabel})`,
    `Yetkili: ${params.fullName}`,
    `Telefon: ${params.phone} · WhatsApp: ${params.whatsappNumber}`,
    `E-posta: ${params.email}`,
    `Mağaza: ${params.storeUrl}`,
    "",
    paidRequested
      ? `Yapılacaklar: müşteriyi arayın, ödeme bilgisini iletin, ödeme gelince paketi ${params.requestedPlanName} yapın.`
      : "Hesap Ücretsiz planla açıldı. Ürün yükleme desteği için aranabilir.",
    "",
    `Admin: ${adminUrl}`,
  ]);

  const subjectTag = paidRequested ? "[Ücretli Paket Talebi]" : "[Yeni Kayıt]";
  const subjectPlan = paidRequested ? `${params.requestedPlanName} ${formatTry(params.requestedPlanPrice)}/yıl — aranacak` : "Ücretsiz";
  const subjectWarn = params.domainOk ? "" : " ⚠ site açılmıyor";

  return {
    subject: `${subjectTag} ${params.businessName} — ${subjectPlan}${subjectWarn}`,
    html: renderEmailLayout({
      title: paidRequested ? "Ücretli paket talebi" : "Yeni kayıt",
      preheader: paidRequested ? `${params.businessName} ${params.requestedPlanName} paketini istedi, aranacak.` : `${params.businessName} ücretsiz planla kayıt oldu.`,
      bodyHtml,
    }),
    text,
    replyTo: `"${params.fullName}" <${params.email}>`,
  };
}
