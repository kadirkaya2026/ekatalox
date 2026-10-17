// Market/tekel Hesabım alt sayfaları (17 Eki 2026): siparişler, bilgilerim,
// adres, şifre. Giriş yoksa /giris'e (dönüşte aynı sayfaya) yönlenir.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  MemberAddressPage,
  MemberInfoPage,
  MemberOrdersPage,
  MemberPasswordPage,
} from "@/components/storefront/member-pages";
import { loadMemberPage, MemberPageProviders, memberPageMetadata } from "@/lib/storefront/member-page";

const SECTIONS = {
  siparisler: { title: "Siparişlerim", Component: MemberOrdersPage },
  bilgilerim: { title: "Bilgilerim", Component: MemberInfoPage },
  adres: { title: "Adresim", Component: MemberAddressPage },
  sifre: { title: "Şifre değiştir", Component: MemberPasswordPage },
} as const;

type Props = { params: Promise<{ subdomain: string; bolum: string }> };

function sectionOf(bolum: string) {
  return Object.prototype.hasOwnProperty.call(SECTIONS, bolum) ? SECTIONS[bolum as keyof typeof SECTIONS] : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { subdomain, bolum } = await props.params;
  return memberPageMetadata(subdomain, sectionOf(bolum)?.title ?? "Hesabım");
}

export default async function MemberSectionPage(props: Props) {
  const { subdomain, bolum } = await props.params;
  const section = sectionOf(bolum);
  const page = section ? await loadMemberPage(subdomain) : null;
  if (!section || !page) notFound();
  if (!page.member) redirect(`/giris?next=${encodeURIComponent(`/hesabim/${bolum}`)}`);
  const { Component } = section;

  return (
    <MemberPageProviders page={page} subdomain={subdomain}>
      <Component subdomain={subdomain} tenantId={page.tenant.id} isTekel={Boolean(page.tenant.is_tekel)} member={page.member} />
    </MemberPageProviders>
  );
}
