import sanitizeHtml from "sanitize-html";

// Kurumsal sitedeki yasal sayfaların (KVKK, gizlilik, mesafeli satış…) HTML'i.
// Metin firmanın kendi sitesinden ya da panelden gelir; vitrinde basılmadan
// önce yalnız metin biçimi etiketlerine indirilir (öznitelik, bağlantı,
// script yok).
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "th", "td"],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

export function sanitizeKurumsalLegalHtml(html: string) {
  return sanitizeHtml(html, OPTIONS);
}
