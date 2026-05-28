import type { ProductVariant, StorefrontProductVariant } from "@/lib/types";

export type SalesUnit = "adet" | "paket" | "koli";

type VariantUnits = Pick<
  ProductVariant | StorefrontProductVariant,
  "stock_quantity" | "package_quantity" | "carton_quantity"
>;

export function isVariantPurchasable(params: {
  productInStock: boolean;
  variant: Pick<ProductVariant | StorefrontProductVariant, "stock_quantity" | "is_available_for_sale">;
}) {
  return (
    params.productInStock &&
    params.variant.is_available_for_sale &&
    params.variant.stock_quantity > 0
  );
}

export function getUnitMultiplier(unit: SalesUnit, variant: VariantUnits) {
  if (unit === "paket") {
    return variant.package_quantity;
  }

  if (unit === "koli") {
    return variant.carton_quantity;
  }

  return 1;
}

export function getMaxUnitCount(unit: SalesUnit, variant: VariantUnits) {
  const multiplier = getUnitMultiplier(unit, variant);

  if (!multiplier || multiplier <= 0) {
    return 0;
  }

  return Math.floor(variant.stock_quantity / multiplier);
}

export function getRequestedUnitQuantity(params: {
  unit: SalesUnit;
  quantity: number;
  variant: VariantUnits;
}) {
  const multiplier = getUnitMultiplier(params.unit, params.variant);

  if (!multiplier || params.quantity <= 0) {
    return 0;
  }

  return params.quantity * multiplier;
}

export function canSelectVariantUnit(params: {
  unit: SalesUnit;
  quantity: number;
  variant: VariantUnits;
}) {
  const requestedUnits = getRequestedUnitQuantity(params);

  if (requestedUnits <= 0) {
    return false;
  }

  return requestedUnits <= params.variant.stock_quantity;
}