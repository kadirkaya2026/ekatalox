// Tek gönderim noktası. ASLA fırlatmaz: SMTP yoksa/patlarsa console.error ile
// loglar ve false döner; kayıt/sipariş akışı e-posta yüzünden hiç bozulmaz.
import { getEmailTransport, getSenderAddress, getStoreSenderAddress } from "@/lib/email/transport";
const PLATFORM_REPLY_TO = "info@ekatalox.com";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  fromName?: string;
  /** Mağaza adına giden müşteri e-postası (gönderen: STORE_EMAIL_FROM). */
  store?: boolean;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const transport = getEmailTransport();

  if (!transport) {
    console.error("[email] SMTP yapılandırması eksik; e-posta gönderilmedi:", params.subject);
    return false;
  }

  const recipients = Array.isArray(params.to) ? params.to.filter(Boolean) : [params.to];
  if (recipients.length === 0) {
    console.error("[email] alıcı yok; e-posta gönderilmedi:", params.subject);
    return false;
  }

  try {
    await transport.sendMail({
      from: `"${(params.fromName ?? "eKatalox").replace(/"/g, "")}" <${params.store ? getStoreSenderAddress() : getSenderAddress()}>`,
      to: recipients.join(", "),
      subject: params.subject,
      html: params.html,
      text: params.text,
      // bildirim@ adresi gelen kutusu değil: yanıt adresi yoksa platform
      // e-postaları info@ekatalox.com'a yanıtlanır (Cloudflare → Gmail yönlendirmesi
      // olan adres); mağaza e-postaları mağazanın adresine.
      ...(params.replyTo ? { replyTo: params.replyTo } : params.store ? {} : { replyTo: PLATFORM_REPLY_TO }),
    });
    return true;
  } catch (error) {
    console.error("[email] gönderim hatası:", params.subject, error);
    return false;
  }
}
