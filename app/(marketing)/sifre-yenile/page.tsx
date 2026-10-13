import type { Metadata } from "next";
import { ResetConfirmForm } from "@/components/marketing/password-reset-forms";
import { Container } from "@/components/marketing/ui";
import { Accent, PageHero } from "@/components/marketing/home-v2/page-kit";

export const metadata: Metadata = { title: "Şifre yenile", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Hesap" title={<>Yeni şifrenizi <Accent>belirleyin.</Accent></>} className="pb-4 sm:pb-6" />
      <section className="bg-white pb-20">
        <Container className="max-w-lg">
          <div className="rounded-[28px] border border-brand-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(18,40,74,0.45)] sm:p-8"><ResetConfirmForm token={token ?? ""} /></div>
        </Container>
      </section>
    </>
  );
}
