import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/marketing/site";

const PRODUCT_LINKS = [
  { href: "/nasil-calisir", label: "Nasıl çalışır" },
  { href: "/ozellikler", label: "Özellikler" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
  { href: "/sss", label: "Sık sorulan sorular" },
  { href: SITE.demoUrl, label: "Demo katalog" },
];

const COMPANY_LINKS = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/yenilikler", label: "Yenilikler" },
  { href: "/yardim", label: "Yardım merkezi" },
];

const LEGAL_LINKS = [
  { href: "/kullanim-sartlari", label: "Kullanım şartları" },
  { href: "/gizlilik-ve-kvkk", label: "Gizlilik ve KVKK" },
];

export function SiteFooter() {
  const { company } = SITE;
  const hasLegal = Boolean(company.legalName || company.address);
  return (
    <footer className="border-t border-brand-line bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Image src="/ekatalox-logo-kurumsal.png" alt="eKatalox" width={132} height={34} className="h-8 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-muted">
            Toptancılar için ücretsiz online katalog ve WhatsApp sipariş sistemi. Bayiniz şifreyle girer, kendi fiyatını görür, sipariş verir.
          </p>
          <div className="mt-5 space-y-1 text-sm">
            <a href={SITE.phoneHref} className="block font-plex-mono font-medium text-brand-navy">{SITE.phone}</a>
            <a href={`mailto:${SITE.salesEmail}`} className="block text-brand-muted hover:text-brand-ink">{SITE.salesEmail}</a>
            <a href={`mailto:${SITE.supportEmail}`} className="block text-brand-muted hover:text-brand-ink">{SITE.supportEmail}</a>
          </div>
        </div>
        <FooterColumn title="Ürün" links={PRODUCT_LINKS} />
        <FooterColumn title="Şirket" links={COMPANY_LINKS} />
        <FooterColumn title="Yasal" links={LEGAL_LINKS} />
      </div>
      <div className="border-t border-brand-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-brand-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} eKatalox. Tüm hakları saklıdır.</p>
          {hasLegal ? (
            <p>
              {[company.legalName, company.address, company.taxOffice && `${company.taxOffice} VD ${company.taxNumber ?? ""}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-brand-muted hover:text-brand-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
