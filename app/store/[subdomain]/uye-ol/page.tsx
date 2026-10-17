// Market/tekel üye kaydı (17 Eki 2026): ayrı sayfa; giriş yapmışsa Hesabım'a.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MemberRegisterPage } from "@/components/storefront/member-pages";
import { loadMemberPage, MemberPageProviders, memberPageMetadata } from "@/lib/storefront/member-page";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { subdomain } = await props.params;
  return memberPageMetadata(subdomain, "Üye ol");
}

export default async function RegisterPage(props: Props) {
  const { subdomain } = await props.params;
  const { next } = await props.searchParams;
  const page = await loadMemberPage(subdomain);
  if (!page) notFound();
  if (page.member) redirect("/hesabim");

  return (
    <MemberPageProviders page={page} subdomain={subdomain}>
      <MemberRegisterPage
        subdomain={subdomain}
        tenantId={page.tenant.id}
        isTekel={Boolean(page.tenant.is_tekel)}
        storeName={page.storeName}
        next={typeof next === "string" ? next : null}
      />
    </MemberPageProviders>
  );
}
