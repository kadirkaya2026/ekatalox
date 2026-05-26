"use client";

import { useState } from "react";
import { BulkOperationsPanel } from "@/components/dashboard/bulk-operations-panel";
import { ProductsManager } from "@/components/dashboard/products-manager";
import type { Category, Product, Tenant } from "@/lib/types";

interface Props {
  tenant: Tenant;
  initialProducts: Product[];
  initialCategories: Category[];
}

export function ProductsPageShell({ tenant, initialProducts, initialCategories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [managerKey, setManagerKey] = useState(0);

  function handleProductsUpdated(updated: Product[]) {
    setProducts(updated);
    setManagerKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <BulkOperationsPanel
        tenant={tenant}
        onProductsUpdated={handleProductsUpdated}
      />
      <ProductsManager
        key={managerKey}
        tenant={tenant}
        initialProducts={products}
        initialCategories={initialCategories}
      />
    </div>
  );
}
