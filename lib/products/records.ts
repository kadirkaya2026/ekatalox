import { isVariantPurchasable } from "@/lib/storefront/variants";
import { normalizeProductPriceRecord } from "@/lib/price-lists/records";
import type {
  Product,
  ProductVariant,
  StorefrontProductVariant,
} from "@/lib/types";

type RawVariantRecord = Record<string, unknown> & {
  package_quantity?: number | null;
  carton_quantity?: number | null;
};

type RawProductRecord = Record<string, unknown> & {
  variants?: unknown;
  product_variants?: unknown;
  product_prices?: unknown;
  prices?: unknown;
};

function getPricesFromRecord(record: RawProductRecord) {
  const rawPrices = Array.isArray(record.product_prices)
    ? record.product_prices
    : Array.isArray(record.prices)
      ? record.prices
      : [];

  return rawPrices
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map(normalizeProductPriceRecord);
}

function sortVariants(left: ProductVariant, right: ProductVariant) {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.model_name.localeCompare(right.model_name, "tr-TR");
}

export function normalizeProductVariantRecord(record: RawVariantRecord): ProductVariant {
  return {
    id: String(record.id ?? ""),
    tenant_id: String(record.tenant_id ?? ""),
    product_id: String(record.product_id ?? ""),
    model_name: String(record.model_name ?? "").trim(),
    stock_quantity: Number(record.stock_quantity ?? 0),
    package_quantity:
      typeof record.package_quantity === "number" ? record.package_quantity : null,
    carton_quantity:
      typeof record.carton_quantity === "number" ? record.carton_quantity : null,
    is_available_for_sale: Boolean(record.is_available_for_sale),
    display_order: Number(record.display_order ?? 0),
    created_at: String(record.created_at ?? ""),
    updated_at: String(record.updated_at ?? record.created_at ?? ""),
  };
}

export function getVariantsFromRecord(record: RawProductRecord) {
  const rawVariants = Array.isArray(record.variants)
    ? record.variants
    : Array.isArray(record.product_variants)
      ? record.product_variants
      : [];

  return rawVariants
    .filter((item): item is RawVariantRecord => Boolean(item) && typeof item === "object")
    .map(normalizeProductVariantRecord)
    .sort(sortVariants);
}

export function normalizeProductRecord(record: RawProductRecord): Product {
  return {
    id: String(record.id ?? ""),
    tenant_id: String(record.tenant_id ?? ""),
    category_id: String(record.category_id ?? ""),
    display_order: Number(record.display_order ?? 0),
    sku_code: String(record.sku_code ?? ""),
    product_name: String(record.product_name ?? ""),
    description: typeof record.description === "string" ? record.description : null,
    image_url: typeof record.image_url === "string" ? record.image_url : null,
    currency: (record.currency ?? "TRY") as Product["currency"],
    prices: getPricesFromRecord(record),
    is_in_stock: Boolean(record.is_in_stock),
    is_discount_active: Boolean(record.is_discount_active),
    discount_price:
      typeof record.discount_price === "number" ? record.discount_price : null,
    package_quantity:
      typeof record.package_quantity === "number" ? record.package_quantity : null,
    carton_quantity:
      typeof record.carton_quantity === "number" ? record.carton_quantity : null,
    created_at: String(record.created_at ?? ""),
    variants: getVariantsFromRecord(record),
  };
}

export function toStorefrontVariant(
  variant: ProductVariant,
  productInStock: boolean,
): StorefrontProductVariant {
  return {
    id: variant.id,
    product_id: variant.product_id,
    model_name: variant.model_name,
    stock_quantity: variant.stock_quantity,
    package_quantity: variant.package_quantity,
    carton_quantity: variant.carton_quantity,
    is_available_for_sale: variant.is_available_for_sale,
    is_purchasable: isVariantPurchasable({
      productInStock,
      variant,
    }),
    display_order: variant.display_order,
  };
}