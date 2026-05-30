import type { CurrencyCode } from "@/lib/products/constants";
import type { CartItem } from "@/lib/types";
import { getUnitMultiplier, type SalesUnit } from "@/lib/storefront/variants";

const currencySymbols: Record<CurrencyCode, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

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

/** PDF tabloda | karakteri satır kırılımını bozabildiği için yalnızca fiş metninde dönüştürülür. */
export function sanitizePdfLabelText(value: string) {
  return value.replace(/\|/g, "-").replace(/\s+/g, " ").trim();
}

export function buildReceiptProductLabel(item: CartItem) {
  const productName = sanitizePdfLabelText(item.product_name);
  const variantName = item.variant_name?.trim();

  if (!variantName) {
    return productName;
  }

  const sanitizedVariant = sanitizePdfLabelText(variantName);
  if (productName.includes(sanitizedVariant)) {
    return productName;
  }

  return `${productName}\nModel: ${sanitizedVariant}`;
}

export function getOrderReceiptLineDisplay(item: CartItem): OrderReceiptLineDisplay {
  const salesUnit = resolveSalesUnit(item);
  const unitQuantity = resolveUnitQuantity(item);
  const multiplier = getUnitMultiplier(salesUnit, item);
  const unitPrice =
    salesUnit === "adet" ? item.price : item.price * (multiplier ?? 1);
  const lineTotal = item.price * item.quantity;

  const productLabel = buildReceiptProductLabel(item);

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
    ];
  });
}
