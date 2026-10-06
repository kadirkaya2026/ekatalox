import sanitizeHtml from "sanitize-html";

// 6 Eki 2026: 2000 → 6000. Sınırı aşan açıklama vitrinde TAMAMEN boş görünüyordu
// (Nailport'ta 39 ürün, ~4.800 karaktere kadar). Panel düzenleyici de bu sınırı kullanır.
export const PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH = 6000;

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "blockquote",
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

export function isHtmlDescription(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value.trim());
}

export function getDescriptionPlainText(value: string) {
  if (!value.trim()) {
    return "";
  }

  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getDescriptionPlainTextLength(value: string) {
  return getDescriptionPlainText(value).length;
}

export function isEmptyDescription(value: string) {
  return getDescriptionPlainTextLength(value) === 0;
}

export function sanitizeProductDescription(html: string): string | null {
  const trimmed = html.trim();

  if (!trimmed) {
    return null;
  }

  const sanitized = sanitizeHtml(trimmed, SANITIZE_OPTIONS).trim();

  if (!sanitized || isEmptyDescription(sanitized)) {
    return null;
  }

  return sanitized;
}

export function normalizeProductDescription(
  value: string | null | undefined,
  maxPlainTextLength = PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = isHtmlDescription(trimmed)
    ? sanitizeProductDescription(trimmed)
    : trimmed;

  if (!normalized) {
    return null;
  }

  if (getDescriptionPlainTextLength(normalized) > maxPlainTextLength) {
    return null;
  }

  return normalized;
}


