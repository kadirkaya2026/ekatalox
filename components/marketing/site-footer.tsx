import Link from "next/link";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { SITE } from "@/lib/marketing/site";

const PRODUCT_LINKS = [
  { href: "/nasil-calisir", label: "Nasıl çalışır" },
  { href: "/ozellikler", label: "Özellikler" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
  { href: "/sss", label: "Sık sorulan sorular" },
  { href: SITE.demoEnterUrl, label: "Demo katalog" },
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

// Koyu altbilgi (21 Eyl 2026 yeniden tasarım): header ile aynı koyu zemin,
// tüm sayfalarda sabit.
export function SiteFooter() {
  const { company } = SITE;
  const hasLegal = Boolean(company.legalName || company.address);
  return (
    <footer className="border-t border-brand-dark-line bg-brand-dark">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <EkataloxLogo variant="dark" alt="eKatalox" className="h-8 w-[132px]" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Toptancılar için ücretsiz online katalog ve WhatsApp sipariş sistemi. Bayiniz şifreyle girer, kendi fiyatını görür, sipariş verir.
          </p>
          <div className="mt-5 space-y-1 text-sm">
            <a href={SITE.phoneHref} className="block font-plex-mono font-medium text-white">{SITE.phone}</a>
            <a href={`mailto:${SITE.salesEmail}`} className="block text-white/60 hover:text-white">{SITE.salesEmail}</a>
            <a href={`mailto:${SITE.supportEmail}`} className="block text-white/60 hover:text-white">{SITE.supportEmail}</a>
          </div>
        </div>
        <FooterColumn title="Ürün" links={PRODUCT_LINKS} />
        <FooterColumn title="Şirket" links={COMPANY_LINKS} />
        <FooterColumn title="Yasal" links={LEGAL_LINKS} />
      </div>
      <div className="border-t border-brand-dark-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/85">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-white/60 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
