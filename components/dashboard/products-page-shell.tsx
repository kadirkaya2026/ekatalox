"use client";

import { useState } from "react";
import { ProductsManager } from "@/components/dashboard/products-manager";
import type { Category, Product, Tenant } from "@/lib/types";

interface Props {
  tenant: Tenant;
  initialProducts: Product[];
  initialCategories: Category[];
}

export function ProductsPageShell({ tenant, initialProducts, initialCategories }: Props) {
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
    />
  );
}
