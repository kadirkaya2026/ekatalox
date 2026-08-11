"use client";

import { ProductsManager } from "@/components/dashboard/products-manager";
import type { Category, PriceList, Product, Tenant } from "@/lib/types";

interface Props {
  tenant: Tenant;
  initialProducts: Product[];
  initialTotal: number;
  initialCategories: Category[];
  priceLists: PriceList[];
}

export function ProductsPageShell({
  tenant,
  initialProducts,
  initialTotal,
  initialCategories,
  priceLists,
}: Props) {
  return (
    <ProductsManager
      tenant={tenant}
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      initialCategories={initialCategories}
      priceLists={priceLists}
    />
  );
}
