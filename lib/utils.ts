import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  defaultCurrencyCode,
  isCurrencyCode,
  normalizeCurrencyCode,
} from "@/lib/products/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = defaultCurrencyCode) {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const safeCurrency = isCurrencyCode(normalizedCurrency)
    ? normalizedCurrency
    : defaultCurrencyCode;

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatDateSlashTr(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

// Supabase/PostgREST filters like .in("id", ids) get embedded in the request
// URL's query string — a few hundred UUIDs can push it past proxy URL-length
// limits and fail with a generic Bad Request. Chunk large id lists before
// issuing such queries.
export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}