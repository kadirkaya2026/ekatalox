import { kurumsalPath } from "@/lib/kurumsal/domain";
import { cn } from "@/lib/utils";

// Kurumsal sitenin ortak iskeleti: üst çubuk + alt bilgi. Ana sayfa
// (/kurumsal), kategori ve ürün sayfaları ile paneldeki sihirbaz önizlemesi
// aynı bileşeni kullanır. Sunucu bileşeni uyumlu (hook/olay yok).
//
// Site ya tenant'ın kendi kök alan adında (basePath "") ya da katalog
// adresinde /kurumsal altında (basePath "/kurumsal") yayınlanır (bkz.
// proxy.ts); bağlantılar kurumsalPath ile tabana göre kurulur. "Bayi Girişi" MUTLAK adresle katalog/sipariş
// ekranına (custom_domain ya da {sub}.ekatalox.com) gider — orada şifre
// kapısı karşılar. preview=true iken tüm bağlantılar "#" olur.

export interface KurumsalShellProps {
  tenantName: string;
  logoUrl: string | null;
  wordmark: string | null;
  accent: string;
  legalName?: string | null;
  isWhiteLabel: boolean;
  /** "Bayimiz Olun" düğmesinin hedefi (#basvuru / WhatsApp); null ise gizli */
  applyHref: string | null;
  /** Katalog/sipariş ekranının mutlak adresi ("Bayi Girişi") */
  catalogUrl: string;
  /** "" alan adı modu, "/kurumsal" platform adresi */
  basePath: "" | "/kurumsal";
  /** true: ana sayfa (çapa bağlantıları sayfa içi), false: alt sayfa (ana sayfaya döner) */
  isHome: boolean;
  showAbout?: boolean;
  preview?: boolean;
  children: React.ReactNode;
}

export function kurumsalHref(href: string, preview?: boolean) {
  return preview ? "#" : href;
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

export function KurumsalShell({
  tenantName,
  logoUrl,
  wordmark,
  accent,
  legalName,
  isWhiteLabel,
  applyHref,
  catalogUrl,
  basePath,
  isHome,
  showAbout = true,
  preview = false,
  children,
}: KurumsalShellProps) {
  const anchor = (id: string) => (isHome ? `#${id}` : kurumsalPath(basePath, `#${id}`));
  const nav = [
    { href: anchor("urunler"), label: "Ürünler" },
    { href: anchor("neden-biz"), label: "Neden Biz" },
    ...(showAbout ? [{ href: anchor("hakkimizda"), label: "Hakkımızda" }] : []),
    { href: anchor("iletisim"), label: "İletişim" },
  ];
  const homeHref = isHome ? "#" : kurumsalPath(basePath, "/");

  return (
    <div
      className={cn("bg-white text-slate-900", preview ? "min-h-0" : "min-h-svh")}
      style={{ ["--k-accent" as string]: accent }}
    >
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <a href={kurumsalHref(homeHref, preview)} className="flex min-w-0 items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-auto" />
            ) : null}
            <span className="truncate text-xl font-extrabold tracking-tight">{wordmark ?? tenantName}</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            {nav.map((item) => (
              <a key={item.href} href={kurumsalHref(item.href, preview)} className="hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={kurumsalHref(catalogUrl, preview)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400"
            >
              Bayi Girişi
            </a>
            {applyHref ? (
              <a
                href={kurumsalHref(applyHref, preview)}
                {...(isExternal(applyHref) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white sm:inline-block"
                style={{ backgroundColor: "var(--k-accent)" }}
              >
                Bayimiz Olun
              </a>
            ) : null}
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-2 text-sm font-medium text-slate-600 md:hidden">
          {nav.map((item) => (
            <a key={item.href} href={kurumsalHref(item.href, preview)} className="shrink-0">
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {children}

      <footer className="bg-slate-950 py-8 text-center text-xs text-slate-400">
        <div>
          © {new Date().getFullYear()} {(legalName || tenantName).replace(/\.$/, "")}. Tüm hakları saklıdır.
        </div>
        {!isWhiteLabel ? (
          <div className="mt-2">
            <a href={kurumsalHref("https://ekatalox.com", preview)} className="hover:text-slate-200">
              eKatalox altyapısıyla hazırlanmıştır
            </a>
          </div>
        ) : null}
      </footer>
    </div>
  );
}

/** Alt sayfalardaki içerik kabı + ekmek kırıntısı. */
export function KurumsalBreadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Konum" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true">›</span> : null}
            {item.href ? (
              <a href={item.href} className="hover:text-slate-900">
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-slate-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Fiyatsız ürün kartı (ana sayfa öne çıkanlar + kategori sayfası). */
export function KurumsalProductCard({
  product,
  basePath,
  preview,
}: {
  product: { id: string; name: string; sku: string; imageUrl: string | null };
  basePath: "" | "/kurumsal";
  preview?: boolean;
}) {
  return (
    <a
      href={kurumsalHref(kurumsalPath(basePath, `/urun/${product.id}`), preview)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex aspect-square items-center justify-center p-4">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain transition group-hover:scale-105"
          />
        ) : (
          <span className="text-xs font-semibold text-slate-400">Görsel yok</span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-slate-100 px-4 py-3">
        <div className="text-xs font-semibold text-slate-500">{product.sku}</div>
        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</div>
        <span className="mt-auto pt-3 text-xs font-bold" style={{ color: "var(--k-accent)" }}>
          Ürünü incele →
        </span>
      </div>
    </a>
  );
}
