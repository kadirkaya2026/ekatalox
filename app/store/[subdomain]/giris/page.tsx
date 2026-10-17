// Market/tekel üye girişi (17 Eki 2026): ayrı sayfa; giriş yapmışsa Hesabım'a.
// E-postadaki şifre yenileme bağlantısı da buraya gelir (?sifirla=).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MemberLoginPage } from "@/components/storefront/member-pages";
import { loadMemberPage, MemberPageProviders, memberPageMetadata } from "@/lib/storefront/member-page";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ next?: string | string[]; sifirla?: string | string[] }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { subdomain } = await props.params;
  return memberPageMetadata(subdomain, "Giriş yap");
}

export default async function LoginPage(props: Props) {
  const { subdomain } = await props.params;
  const { next, sifirla } = await props.searchParams;
  const page = await loadMemberPage(subdomain);
  if (!page) notFound();
  const resetToken = typeof sifirla === "string" ? sifirla : null;
  const nextPath = typeof next === "string" ? next : null;
  if (page.member && !resetToken) redirect(nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/hesabim");

  return (
    <MemberPageProviders page={page} subdomain={subdomain}>
      <MemberLoginPage
        subdomain={subdomain}
        tenantId={page.tenant.id}
        isTekel={Boolean(page.tenant.is_tekel)}
        storeName={page.storeName}
        next={nextPath}
        resetToken={resetToken}
      />
    </MemberPageProviders>
  );
}
