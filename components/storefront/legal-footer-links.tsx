import {
  LEGAL_DOC_SLUGS,
  LEGAL_DOC_TITLES,
  isLegalProfileComplete,
  readLegalProfile,
} from "@/lib/legal/tenant-legal";
import type { TenantStorefrontSettings } from "@/lib/types";

// Sektör temalarında altbilginin altına sözleşme bağlantıları (0178). Yalnız
// mağazanın yasal bilgileri tamamsa görünür; renk temadan (currentColor).
export function LegalFooterLinks({ settings }: { settings: Pick<TenantStorefrontSettings, "legal_profile"> }) {
  if (!isLegalProfileComplete(readLegalProfile(settings.legal_profile))) return null;
  return (
    <nav
      aria-label="Yasal sayfalar"
      className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4 py-3 text-[11px] leading-tight opacity-70"
    >
      {LEGAL_DOC_SLUGS.map((slug) => (
        <a key={slug} href={`/yasal/${slug}`} className="hover:underline">
          {LEGAL_DOC_TITLES[slug]}
        </a>
      ))}
    </nav>
  );
}
