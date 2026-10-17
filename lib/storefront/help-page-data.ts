// /yardim sayfaları için ortak veri (0184): müşteri hizmetleri (Footer ayarları,
// yoksa yasal bilgiler), mağazanın yazdığı sayfalar ve yasal sözleşmeler.
import { LEGAL_DOC_SLUGS, LEGAL_DOC_TITLES, isLegalProfileComplete, readLegalProfile } from "@/lib/legal/tenant-legal";
import { toWhatsAppDigits } from "@/lib/storefront/customer-phone";
import { readHelpPages } from "@/lib/storefront/help-pages";
import type { Tenant, TenantStorefrontSettings } from "@/lib/types";

export function buildHelpData(tenant: Tenant, settings: TenantStorefrontSettings) {
  const help = readHelpPages(settings.help_pages);
  const legal = readLegalProfile(settings.legal_profile);
  const support = {
    phone: settings.footer_phone?.trim() || legal.phone?.trim() || null,
    whatsapp: toWhatsAppDigits(settings.footer_whatsapp || tenant.whatsapp_number),
    email: settings.footer_email?.trim() || legal.email?.trim() || null,
    address: settings.footer_location?.trim() || null,
    note: help.support_note,
  };
  const links: Array<{ href: string; label: string }> = [];
  if (help.about) links.push({ href: "/yardim/hakkimizda", label: "Hakkımızda" });
  if (help.faq.length) links.push({ href: "/yardim/sss", label: "Sıkça Sorulan Sorular" });
  if (isLegalProfileComplete(legal)) {
    for (const slug of LEGAL_DOC_SLUGS) links.push({ href: `/yasal/${slug}`, label: LEGAL_DOC_TITLES[slug] });
  }
  return { help, support, links };
}
