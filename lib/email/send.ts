// Tek gönderim noktası. ASLA fırlatmaz: SMTP yoksa/patlarsa console.error ile
// loglar ve false döner; kayıt/sipariş akışı e-posta yüzünden hiç bozulmaz.
import { getEmailTransport, getSenderAddress } from "@/lib/email/transport";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  fromName?: string;
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
      from: `"${params.fromName ?? "eKatalox"}" <${getSenderAddress()}>`,
      to: recipients.join(", "),
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });
    return true;
  } catch (error) {
    console.error("[email] gönderim hatası:", params.subject, error);
    return false;
  }
}
