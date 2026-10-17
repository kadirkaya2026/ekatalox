// Market vitrini Yardım (17 Eki 2026, Getir örneği): müşteri hizmetleri,
// Hakkımızda, Sıkça Sorulan Sorular ve sözleşmeler. Giriş gerektirmez.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberHelpPage } from "@/components/storefront/member-pages";
import { buildHelpData } from "@/lib/storefront/help-page-data";
import { loadMemberPage, MemberPageProviders, memberPageMetadata } from "@/lib/storefront/member-page";

type Props = { params: Promise<{ subdomain: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { subdomain } = await props.params;
  return memberPageMetadata(subdomain, "Yardım");
}

export default async function HelpPage(props: Props) {
  const { subdomain } = await props.params;
  const page = await loadMemberPage(subdomain);
  if (!page) notFound();
  const { support, links } = buildHelpData(page.tenant, page.settings);
  return (
    <MemberPageProviders page={page} subdomain={subdomain}>
      <MemberHelpPage
        subdomain={subdomain}
        tenantId={page.tenant.id}
        isTekel={Boolean(page.tenant.is_tekel)}
        storeName={page.storeName}
        support={support}
        links={links}
      />
    </MemberPageProviders>
  );
}
