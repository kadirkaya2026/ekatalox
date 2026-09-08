import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/marketing/password-reset-forms";
import { Container, Section, SectionHeading } from "@/components/marketing/ui";

export const metadata: Metadata = { title: "Şifremi unuttum", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <Section>
      <Container className="max-w-lg">
        <SectionHeading eyebrow="Hesap" title="Şifrenizi mi unuttunuz?" lead="Kayıtlı e-posta adresinize tek kullanımlık bir yenileme bağlantısı gönderelim." />
        <div className="mt-8"><ResetRequestForm /></div>
      </Container>
    </Section>
  );
}
