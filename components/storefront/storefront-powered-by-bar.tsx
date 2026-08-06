"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";

// Tenant admin panelinden ve mağaza ayarlarından kaldırılamayan, sabit
// "eKatalox ürünüdür" rozeti. Özel alan adına bağlansa, footer kapatılsa
// veya footer'da telif hakkı tenant adıyla özelleştirilse bile sayfanın en
// altında değişmeden görünür — bu yüzden StorefrontFooter yerine doğrudan
// StorefrontPageShell'e bağlıdır.
export function StorefrontPoweredByBar() {
  const { t } = useStorefrontLocale();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoVariant = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="border-t border-black/5 bg-white/70 py-1.5 dark:border-white/10 dark:bg-black/20">
      <div className="container-shell flex items-center justify-center">
        <a
          href="https://ekatalox.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("header.poweredByAria")}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span>{t("header.poweredByPrefix")}</span>
          <EkataloxLogo
            variant={logoVariant}
            alt="eKatalox"
            className="h-3.5 w-[62px]"
          />
          {t("header.poweredBySuffix") ? <span>{t("header.poweredBySuffix")}</span> : null}
        </a>
      </div>
    </div>
  );
}
