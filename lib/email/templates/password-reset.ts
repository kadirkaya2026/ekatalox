// Şifre sıfırlama bağlantısı (özel akış; Supabase Auth e-postası değil).
import {
  button,
  escapeHtml,
  heading,
  noteBox,
  paragraph,
  renderEmailLayout,
  renderEmailText,
} from "@/lib/email/layout";

export const PASSWORD_RESET_TTL_MINUTES = 60;

export function buildPasswordResetEmail(params: { resetUrl: string; fullName?: string | null }) {
  const greeting = params.fullName ? `Merhaba ${params.fullName},` : "Merhaba,";

  const bodyHtml = [
    heading("Şifrenizi yenileyin"),
    paragraph(escapeHtml(greeting)),
    paragraph(
      "eKatalox hesabınız için şifre yenileme isteği aldık. Yeni şifrenizi belirlemek için aşağıdaki düğmeye tıklayın.",
    ),
    button(params.resetUrl, "Yeni şifre belirle"),
    noteBox(
      `Bağlantı <strong>${PASSWORD_RESET_TTL_MINUTES} dakika</strong> geçerlidir ve yalnızca bir kez kullanılabilir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.`,
    ),
    paragraph(
      `Düğme çalışmazsa şu adresi tarayıcınıza yapıştırın:<br><a href="${escapeHtml(params.resetUrl)}" style="color:#157A5B;word-break:break-all;">${escapeHtml(params.resetUrl)}</a>`,
    ),
  ].join("");

  const text = renderEmailText([
    greeting,
    "",
    "eKatalox hesabınız için şifre yenileme isteği aldık.",
    `Yeni şifrenizi belirlemek için bağlantı (${PASSWORD_RESET_TTL_MINUTES} dakika geçerli):`,
    params.resetUrl,
    "",
    "Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.",
  ]);

  return {
    subject: "eKatalox şifre yenileme bağlantınız",
    html: renderEmailLayout({ title: "Şifrenizi yenileyin", bodyHtml }),
    text,
  };
}
