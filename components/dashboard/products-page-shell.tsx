"use client";

import { ProductsManager } from "@/components/dashboard/products-manager";
import type { ProductStockFilter } from "@/lib/products/constants";
import type { Category, PriceList, Product, Tenant } from "@/lib/types";

interface Props {
  tenant: Tenant;
  initialProducts: Product[];
  initialTotal: number;
  initialCategories: Category[];
  priceLists: PriceList[];
  initialSearchTerm?: string;
  initialStockFilter?: ProductStockFilter;
  focusProductId?: string | null;
}

export function ProductsPageShell({
  tenant,
  initialProducts,
  initialTotal,
  initialCategories,
  priceLists,
  initialSearchTerm,
  initialStockFilter,
  focusProductId,
}: Props) {
  return (
    <ProductsManager
      tenant={tenant}
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      initialCategories={initialCategories}
      priceLists={priceLists}
      initialSearchTerm={initialSearchTerm}
      initialStockFilter={initialStockFilter}
      focusProductId={focusProductId}
    />
  );
}
