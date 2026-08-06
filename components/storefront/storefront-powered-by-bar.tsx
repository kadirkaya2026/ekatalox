"use client";

import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";

// Tenant admin panelinden ve mağaza ayarlarından kaldırılamayan, sabit
// "eKatalox ürünüdür" rozeti. Özel alan adına bağlansa, footer kapatılsa
// veya footer'da telif hakkı tenant adıyla özelleştirilse bile sayfanın en
// altında değişmeden görünür — bu yüzden StorefrontFooter yerine doğrudan
// StorefrontPageShell'e bağlıdır. Arka plan mağaza temasından bağımsız
// olarak her zaman siyah — açık/koyu tema ayrımı yapılmaz.
export function StorefrontPoweredByBar() {
  const { t } = useStorefrontLocale();

  return (
    <div className="bg-black py-1.5">
      <div className="container-shell flex items-center justify-center">
        <a
          href="https://ekatalox.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("header.poweredByAria")}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 transition hover:text-white"
        >
          <span>{t("header.poweredByPrefix")}</span>
          <EkataloxLogo variant="dark" alt="eKatalox" className="h-3.5 w-[62px]" />
          {t("header.poweredBySuffix") ? <span>{t("header.poweredBySuffix")}</span> : null}
        </a>
      </div>
    </div>
  );
}
