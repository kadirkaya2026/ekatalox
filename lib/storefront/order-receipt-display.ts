import type { CurrencyCode } from "@/lib/products/constants";
import type { CartItem } from "@/lib/types";

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

export interface OrderReceiptLineDisplay {
  productLabel: string;
  unitLabel: string;
  quantityLabel: string;
  unitPriceLabel: string | null;
  lineTotalLabel: string | null;
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

export function getOrderReceiptLineDisplay(
  item: CartItem,
  catalogMode = false,
): OrderReceiptLineDisplay {
  const productLabel = buildReceiptProductLabel(item);

  if (catalogMode || item.price === null) {
    return {
      productLabel,
      unitLabel: "Adet",
      quantityLabel: String(item.quantity),
      unitPriceLabel: null,
      lineTotalLabel: null,
    };
  }

  const lineTotal = item.price * item.quantity;

  return {
    productLabel,
    unitLabel: "Adet",
    quantityLabel: String(item.quantity),
    unitPriceLabel: formatReceiptMoney(item.price, item.currency),
    lineTotalLabel: formatReceiptMoney(lineTotal, item.currency),
  };
}

export function getOrderReceiptTableRows(items: CartItem[], catalogMode = false) {
  return items.map((item) => {
    const line = getOrderReceiptLineDisplay(item, catalogMode);

    if (catalogMode) {
      return [line.productLabel, line.unitLabel, line.quantityLabel];
    }

    return [
      line.productLabel,
      line.unitLabel,
      line.quantityLabel,
      line.unitPriceLabel ?? "",
      line.lineTotalLabel ?? "",
    ];
  });
}

export function getOrderReceiptTableHead(catalogMode = false) {
  if (catalogMode) {
    return ["Ürün", "Birim", "Adet"];
  }

  return ["Ürün", "Birim", "Adet", "Birim Fiyat", "Tutar"];
}
