"use client";

import { useState } from "react";
import { ProductsManager } from "@/components/dashboard/products-manager";
import type { Category, PriceList, Product, Tenant } from "@/lib/types";

interface Props {
  tenant: Tenant;
  initialProducts: Product[];
  initialCategories: Category[];
  priceLists: PriceList[];
}

export function ProductsPageShell({
  tenant,
  initialProducts,
  initialCategories,
  priceLists,
}: Props) {
  const [products, setProducts] = useState(initialProducts);

  function handleProductsUpdated(updated: Product[]) {
    setProducts(updated);
  }

  return (
    <ProductsManager
      tenant={tenant}
      products={products}
      onProductsUpdated={handleProductsUpdated}
      initialProducts={products}
      initialCategories={initialCategories}
      priceLists={priceLists}
    />
  );
}
