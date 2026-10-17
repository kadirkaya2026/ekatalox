// Yardım alt sayfaları (0184): Hakkımızda ve Sıkça Sorulan Sorular.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberHelpArticlePage, MemberHelpFaqPage } from "@/components/storefront/member-pages";
import { readHelpPages } from "@/lib/storefront/help-pages";
import { loadMemberPage, MemberPageProviders, memberPageMetadata } from "@/lib/storefront/member-page";

const TITLES: Record<string, string> = { hakkimizda: "Hakkımızda", sss: "Sıkça Sorulan Sorular" };

type Props = { params: Promise<{ subdomain: string; bolum: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { subdomain, bolum } = await props.params;
  return memberPageMetadata(subdomain, TITLES[bolum] ?? "Yardım");
}

export default async function HelpSectionPage(props: Props) {
  const { subdomain, bolum } = await props.params;
  const title = TITLES[bolum];
  const page = title ? await loadMemberPage(subdomain) : null;
  if (!title || !page) notFound();
  const help = readHelpPages(page.settings.help_pages);
  const base = { subdomain, tenantId: page.tenant.id, isTekel: Boolean(page.tenant.is_tekel) };

  return (
    <MemberPageProviders page={page} subdomain={subdomain}>
      {bolum === "sss" ? (
        help.faq.length ? <MemberHelpFaqPage {...base} title={title} items={help.faq} /> : notFound()
      ) : help.about ? (
        <MemberHelpArticlePage {...base} title={title} body={help.about} />
      ) : (
        notFound()
      )}
    </MemberPageProviders>
  );
}
