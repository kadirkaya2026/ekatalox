import type { Metadata } from "next";
import { ResetConfirmForm } from "@/components/marketing/password-reset-forms";
import { Container, Section, SectionHeading } from "@/components/marketing/ui";

export const metadata: Metadata = { title: "Şifre yenile", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <Section>
      <Container className="max-w-lg">
        <SectionHeading eyebrow="Hesap" title="Yeni şifrenizi belirleyin" />
        <div className="mt-8"><ResetConfirmForm token={token ?? ""} /></div>
      </Container>
    </Section>
  );
}
