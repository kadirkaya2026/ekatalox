// Ücretli paket denemesi e-postaları (25 Eyl 2026, 0132). /api/cron/plan-trial
// gönderir: bitişe PAID_PLAN_TRIAL_REMINDER_DAYS kala müşteriye hatırlatma,
// süre dolup Ücretsiz plana düşünce müşteriye ve satışa bilgi.
import { SITE } from "@/lib/marketing/site";
import {
  button,
  escapeHtml,
  formatDateTr,
  heading,
  paragraph,
  renderEmailLayout,
  renderEmailText,
} from "@/lib/email/layout";

interface PlanTrialEmailParams {
  businessName: string;
  contactName: string | null;
  planName: string;
  trialEndsAt: string;
  panelUrl: string;
}

export function buildPlanTrialReminderEmail(params: PlanTrialEmailParams) {
  const end = formatDateTr(params.trialEndsAt);
  const hello = params.contactName ? `Merhaba ${escapeHtml(params.contactName)},` : "Merhaba,";
  const bodyHtml = [
    heading(`${escapeHtml(params.planName)} denemeniz ${escapeHtml(end)} tarihinde bitiyor`),
    paragraph(
      `${hello} <strong>${escapeHtml(params.businessName)}</strong> kataloğunuz ${escapeHtml(params.planName)} paketinin deneme süresinde. Ödeme yapıldığında paketiniz kalıcı olur; yapılmazsa ${escapeHtml(end)} tarihinde kataloğunuz kapanmadan Ücretsiz plana geçer (reklamlar görünür, ürün ve fiyat listesi limitleri düşer).`,
    ),
    paragraph(
      `Ödeme bilgisi için bu e-postayı yanıtlayın ya da <a href="${SITE.whatsappHref}" style="color:#157A5B;">WhatsApp'tan yazın</a>.`,
    ),
    button(params.panelUrl, "Yönetim paneline gir"),
  ].join("");

  return {
    subject: `${params.planName} denemeniz ${end} tarihinde bitiyor — eKatalox`,
    html: renderEmailLayout({ title: "Deneme süreniz bitiyor", preheader: `${params.planName} denemesi ${end} tarihinde bitiyor.`, bodyHtml }),
    text: renderEmailText([
      `${params.planName} denemeniz ${end} tarihinde bitiyor.`,
      "",
      `${params.businessName} kataloğunuz ${params.planName} paketinin deneme süresinde. Ödeme yapılmazsa ${end} tarihinde Ücretsiz plana geçer; kataloğunuz kapanmaz.`,
      `Ödeme bilgisi için bu e-postayı yanıtlayın ya da WhatsApp: ${SITE.phone}`,
      `Panel: ${params.panelUrl}`,
    ]),
  };
}

export function buildPlanTrialEndedEmail(params: PlanTrialEmailParams) {
  const hello = params.contactName ? `Merhaba ${escapeHtml(params.contactName)},` : "Merhaba,";
  const bodyHtml = [
    heading("Kataloğunuz Ücretsiz plana geçti"),
    paragraph(
      `${hello} <strong>${escapeHtml(params.businessName)}</strong> için ${escapeHtml(params.planName)} deneme süresi doldu. Kataloğunuz açık ve çalışmaya devam ediyor; Ücretsiz planda küçük eKatalox tanıtımları görünür ve limitler Ücretsiz plana göre uygulanır.`,
    ),
    paragraph(
      `${escapeHtml(params.planName)} paketine istediğiniz zaman geri dönebilirsiniz: bu e-postayı yanıtlayın ya da <a href="${SITE.whatsappHref}" style="color:#157A5B;">WhatsApp'tan yazın</a>.`,
    ),
    button(params.panelUrl, "Yönetim paneline gir"),
  ].join("");

  return {
    subject: `Kataloğunuz Ücretsiz plana geçti — eKatalox`,
    html: renderEmailLayout({ title: "Ücretsiz plana geçildi", preheader: `${params.planName} denemesi doldu, katalog açık.`, bodyHtml }),
    text: renderEmailText([
      "Kataloğunuz Ücretsiz plana geçti.",
      "",
      `${params.businessName} için ${params.planName} deneme süresi doldu. Kataloğunuz açık; Ücretsiz planda tanıtımlar görünür.`,
      `Pakete geri dönmek için yanıtlayın ya da WhatsApp: ${SITE.phone}`,
      `Panel: ${params.panelUrl}`,
    ]),
  };
}
