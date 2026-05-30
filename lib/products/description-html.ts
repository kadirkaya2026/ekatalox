import DOMPurify from "isomorphic-dompurify";

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

export function isHtmlDescription(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value.trim());
}

export function getDescriptionPlainText(value: string) {
  if (!value.trim()) {
    return "";
  }

  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
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

  const sanitized = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  }).trim();

  if (!sanitized || isEmptyDescription(sanitized)) {
    return null;
  }

  return sanitized;
}

export function normalizeProductDescription(
  value: string | null | undefined,
  maxPlainTextLength = 2000,
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

export const PRODUCT_DESCRIPTION_MAX_PLAIN_TEXT_LENGTH = 2000;
