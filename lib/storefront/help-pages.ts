// Market vitrini "Yardım" sayfaları (0184, 17 Eki 2026, Getir örneği). Mağaza
// Ayarlar > Yardım Sayfaları'ndan Hakkımızda, Sıkça Sorulan Sorular ve müşteri
// hizmetleri notunu yazar; iletişim bilgileri Footer ayarlarından gelir.
export type HelpFaqItem = { q: string; a: string };

export type HelpPages = {
  about: string;
  faq: HelpFaqItem[];
  support_note: string;
};

export const MAX_FAQ_ITEMS = 30;

export function readHelpPages(raw: unknown): HelpPages {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const faq = Array.isArray(value.faq)
    ? value.faq
        .map((item) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return { q: text(row.q).trim(), a: text(row.a).trim() };
        })
        .filter((item) => item.q && item.a)
        .slice(0, MAX_FAQ_ITEMS)
    : [];
  return { about: text(value.about).trim(), faq, support_note: text(value.support_note).trim() };
}
