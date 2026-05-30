import type { CurrencyCode } from "@/lib/products/constants";
import type { CartItem } from "@/lib/types";
import { getUnitMultiplier, type SalesUnit } from "@/lib/storefront/variants";

const currencySymbols: Record<CurrencyCode, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

const TR_CHAR_MAP: Record<string, string> = {
  ş: "s",
  Ş: "S",
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ü: "u",
  Ü: "U",
};

export function toPdfAsciiText(value: string) {
  return value
    .split("")
    .map((char) => TR_CHAR_MAP[char] ?? char)
    .join("")
    .replace(/₺/g, " TL")
    .replace(/€/g, " EUR");
}

function roundCurrencyAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatReceiptMoney(value: number, currency: CurrencyCode) {
  return `${roundCurrencyAmount(value).toFixed(2)} ${currencySymbols[currency]}`;
}

const salesUnitLabels: Record<SalesUnit, string> = {
  adet: "Adet",
  paket: "Paket",
  koli: "Koli",
};

function resolveSalesUnit(item: CartItem): SalesUnit {
  return item.sales_unit ?? "adet";
}

function resolveUnitQuantity(item: CartItem) {
  return item.unit_quantity ?? item.quantity;
}

export interface OrderReceiptLineDisplay {
  productLabel: string;
  unitLabel: string;
  quantityLabel: string;
  unitPriceLabel: string;
  lineTotalLabel: string;
}

export function getOrderReceiptLineDisplay(item: CartItem): OrderReceiptLineDisplay {
  const salesUnit = resolveSalesUnit(item);
  const unitQuantity = resolveUnitQuantity(item);
  const multiplier = getUnitMultiplier(salesUnit, item);
  const unitPrice =
    salesUnit === "adet" ? item.price : item.price * (multiplier ?? 1);
  const lineTotal = item.price * item.quantity;

  const productLabel = item.variant_name
    ? `${item.product_name} / ${item.variant_name}`
    : item.product_name;

  return {
    productLabel,
    unitLabel: salesUnitLabels[salesUnit],
    quantityLabel: String(unitQuantity),
    unitPriceLabel: formatReceiptMoney(unitPrice, item.currency),
    lineTotalLabel: formatReceiptMoney(lineTotal, item.currency),
  };
}

export function getOrderReceiptTableRows(items: CartItem[]) {
  return items.map((item) => {
    const line = getOrderReceiptLineDisplay(item);
    return [
      line.productLabel,
      line.unitLabel,
      line.quantityLabel,
      line.unitPriceLabel,
      line.lineTotalLabel,
    ].map((cell) => toPdfAsciiText(cell));
  });
}
