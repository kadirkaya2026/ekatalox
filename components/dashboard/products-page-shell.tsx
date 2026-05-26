"use client";

import { useMemo, useState } from "react";
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
  const [categories, setCategories] = useState(initialCategories);

  const usage = useMemo(
    () => ({
      total: products.length,
      limit: tenant.max_product_limit,
      remaining: Math.max(tenant.max_product_limit - products.length, 0),
    }),
    [products.length, tenant.max_product_limit],
  );

  function handleProductsUpdated(updated: Product[]) {
    setProducts(updated);
  }

  function handleCategoriesUpdated(updated: Category[]) {
    setCategories(updated);
  }

  return (
    <div className="space-y-6">
      <BulkOperationsPanel
        tenant={tenant}
        usage={usage}
        onProductsUpdated={handleProductsUpdated}
        onCategoriesUpdated={handleCategoriesUpdated}
      />
      <ProductsManager
        tenant={tenant}
        products={products}
        onProductsUpdated={handleProductsUpdated}
        initialProducts={products}
        initialCategories={categories}
      />
    </div>
  );
}
